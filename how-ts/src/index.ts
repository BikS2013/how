#!/usr/bin/env node

/**
 * How-CLI - Terminal assistant generating accurate shell commands
 * TypeScript implementation with multi-provider AI support
 */

import * as os from 'os';
import * as process from 'process';
import { header, typewriterEffect } from './utils/display';
import { cleanResponse } from './utils/text';
import { getInstalledTools, getCurrentTerminal, getFilesList, isGitRepository } from './utils/system';
import { logHistory, showHistory } from './utils/history';
import { AuthError, ContentError, ApiTimeoutError, ApiError } from './errors';
import { resolveConfig } from './config/config-loader';
import { createProvider, getSupportedProviders, getProviderName, isValidProvider } from './providers';
import { AIProvider } from './config';

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle --help or no arguments
  if (args.length === 0 || args.includes('--help')) {
    header();
    console.log('Usage: how-ts <question> [options]');
    console.log('\nOptions:');
    console.log('  --provider <name>    AI provider: ' + getSupportedProviders().join(', '));
    console.log('  --model <name>       Model name for the selected provider');
    console.log('  --config <path>      Path to config file (default: ~/.how-cli/config.json)');
    console.log('  --silent             Suppress spinner and typewriter effect');
    console.log('  --type               Show output with typewriter effect');
    console.log('  --verbose            Print the complete request sent to the model');
    console.log('  --history            Show command/question history');
    console.log('  --help               Show this help message and exit');
    console.log('\nEnvironment Variables:');
    console.log('  AI_PROVIDER                 - Set default provider');
    console.log('  GOOGLE_API_KEY              - Google Gemini API key');
    console.log('  OPENAI_API_KEY              - OpenAI API key');
    console.log('  ANTHROPIC_API_KEY           - Anthropic Claude API key');
    console.log('  AZURE_OPENAI_API_KEY        - Azure OpenAI API key');
    console.log('  AZURE_OPENAI_ENDPOINT       - Azure OpenAI endpoint');
    console.log('  AZURE_OPENAI_API_VERSION    - Azure OpenAI API version');
    console.log('  AZURE_OPENAI_DEPLOYMENT     - Azure OpenAI deployment name');
    console.log('  VERTEX_PROJECT_ID           - Google Cloud project ID for Vertex AI');
    console.log('  VERTEX_LOCATION             - Vertex AI location');
    console.log('\nExamples:');
    console.log('  how-ts to list all files');
    console.log('  how-ts --provider openai to create a git repository');
    console.log('  how-ts --provider claude --model claude-3-5-sonnet-20241022 to check disk usage');
    process.exit(0);
  }

  // Parse flags
  const silent = args.includes('--silent');
  const typeEffect = args.includes('--type') && !silent;
  const verbose = args.includes('--verbose');

  // Handle --history
  if (args.includes('--history')) {
    showHistory();
    process.exit(0);
  }

  // Parse provider and model flags
  let cliProvider: AIProvider | undefined;
  let cliModel: string | undefined;
  let configPath: string | undefined;

  if (args.includes('--provider')) {
    const idx = args.indexOf('--provider');
    if (args.length > idx + 1) {
      const providerArg = args[idx + 1].trim();
      if (isValidProvider(providerArg)) {
        cliProvider = providerArg;
      } else {
        console.error(`Error: Invalid provider "${providerArg}". Supported providers: ${getSupportedProviders().join(', ')}`);
        process.exit(1);
      }
    }
  }

  if (args.includes('--model')) {
    const idx = args.indexOf('--model');
    if (args.length > idx + 1) {
      cliModel = args[idx + 1].trim();
    }
  }

  if (args.includes('--config')) {
    const idx = args.indexOf('--config');
    if (args.length > idx + 1) {
      configPath = args[idx + 1].trim();
    }
  }

  // Filter out flags to get the actual question
  const flagsToRemove = ['--silent', '--history', '--type', '--verbose', '--provider', '--model', '--config', '--help'];
  const questionArgs = args.filter((arg, index) => {
    // Remove flags
    if (flagsToRemove.includes(arg)) return false;

    // Remove flag values (arguments after flags)
    const prevArg = args[index - 1];
    if (prevArg && (prevArg === '--provider' || prevArg === '--model' || prevArg === '--config')) {
      return false;
    }

    return true;
  });

  if (questionArgs.length === 0) {
    console.error('Error: No question provided.');
    process.exit(1);
  }

  const question = questionArgs.join(' ');

  // Resolve configuration (CLI args > env vars > config file > defaults)
  let config;
  try {
    config = resolveConfig(cliProvider, cliModel, configPath);
  } catch (error) {
    console.error(`❌ Configuration Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Create provider instance
  let provider;
  try {
    provider = createProvider(config);
    console.log(`Using ${getProviderName(config.provider)} provider...`);
  } catch (error) {
    console.error(`❌ Provider Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Validate provider configuration
  try {
    provider.validateConfig();
  } catch (error) {
    console.error(`❌ Configuration Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Gather system context
  const currentDir = process.cwd();
  const currentUser = os.userInfo().username;
  const currentOs = `${os.platform()} ${os.release()}`;
  const files = getFilesList(currentDir, 20);
  const gitRepo = isGitRepository(currentDir) ? 'Yes' : 'No';
  const tools = getInstalledTools();
  const shell = getCurrentTerminal();

  // Build prompt
  const prompt = `SYSTEM:
    You are an expert, concise shell assistant. Your goal is to provide accurate, executable shell commands.

    CONTEXT:
    -   **OS:** ${currentOs}
    -   **Shell:** ${shell}
    -   **CWD:** ${currentDir}
    -   **User:** ${currentUser}
    -   **Git Repo:** ${gitRepo}
    -   **Files (top 20):** ${files}
    -   **Available Tools:** ${tools}

    RULES:
    1.  **Primary Goal:** Generate *only* the exact, executable shell command(s) for the \`${shell}\` environment.
    2.  **Context is Key:** Use the CONTEXT (CWD, Files, OS) to write specific, correct commands.
    3.  **No Banter:** Do NOT include greetings, sign-offs, or conversational filler (e.g., "Here is the command:").
    4.  **Safety:** If a command is complex or destructive (e.g., \`rm -rf\`, \`find -delete\`), add a single-line comment (\`# ...\`) *after* the command explaining what it does.
    5.  **Questions:** If the user asks a question (e.g., "what is \`ls\`?"), provide a concise, one-line answer. Do not output a command.
    6.  **Ambiguity:** If the request is unclear, ask a single, direct clarifying question. Start the line with \`#\`.

    REQUEST:
    ${question}

    RESPONSE:
    `;

  // Print verbose output if requested
  if (verbose) {
    console.log('\n' + '='.repeat(80));
    console.log('VERBOSE: Complete Request Details');
    console.log('='.repeat(80));
    console.log(`Provider: ${getProviderName(config.provider)}`);

    // Get the model based on the provider
    let modelName = 'default';
    switch (config.provider) {
      case 'gemini':
        modelName = config.gemini.model;
        break;
      case 'openai':
        modelName = config.openai.model;
        break;
      case 'azure':
        modelName = config.azure.deployment;
        break;
      case 'claude':
        modelName = config.claude.model;
        break;
      case 'vertex-claude':
        modelName = config.vertexClaude.model;
        break;
    }

    console.log(`Model: ${modelName}`);
    console.log('\nPrompt:\n');
    console.log(prompt);
    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Generate response
  let text: string;
  try {
    text = await provider.generateResponse(prompt, silent, verbose);
  } catch (error) {
    if (error instanceof AuthError || error instanceof ContentError ||
        error instanceof ApiTimeoutError || error instanceof ApiError) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  // Clean and process response
  const rawCommands = cleanResponse(text);
  const commands = rawCommands.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (commands.length === 0) {
    console.warn('⚠️  No valid commands generated.');
    process.exit(1);
  }

  const fullCommand = commands.join('\n');

  // Display output
  if (typeEffect) {
    await typewriterEffect(fullCommand);
  } else {
    console.log(fullCommand);
  }

  // Copy to clipboard
  try {
    const clipboardy = await import('clipboardy');
    await clipboardy.default.write(fullCommand);
  } catch (error) {
    // Clipboard copy failed, log warning but continue
    console.warn(`Clipboard copy failed: ${error instanceof Error ? error.message : error}`);
  }

  // Log to history
  logHistory(question, commands);
}

// Run main function with error handling
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      if (error.code === 'ERR_MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
        console.error('\n❌ Missing dependencies. Run: npm install');
        process.exit(1);
      }

      console.error(`\n💥 Unexpected error: ${error?.constructor?.name || 'Error'}: ${error?.message || error}`);
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    })
    .finally(() => {
      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log('\n👋 Interrupted.');
        process.exit(130);
      });
    });
}

export { main };
