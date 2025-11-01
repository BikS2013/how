#!/usr/bin/env node

/**
 * OS Prompt Generator (os-prompt)
 * Wraps a user question with system context and rules used by How-CLI
 */

import * as os from 'os';
import * as process from 'process';
import * as fs from 'fs';
import * as path from 'path';
import { getInstalledTools, getCurrentTerminal, getFilesList, isGitRepository } from './utils/system';
import { header } from './utils/display';

export function buildOsPrompt(question: string, opts?: { maxFiles?: number; cwd?: string; shell?: string }): string {
  const currentDir = opts?.cwd ?? process.cwd();
  const currentUser = os.userInfo().username;
  const currentOs = `${os.platform()} ${os.release()}`;
  const files = getFilesList(currentDir, opts?.maxFiles ?? 20);
  const gitRepo = isGitRepository(currentDir) ? 'Yes' : 'No';
  const tools = getInstalledTools();
  const shell = opts?.shell ?? getCurrentTerminal();

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

  return prompt;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    header();
    console.log('Usage: os-prompt <question> [options]');
    console.log('\nOptions:');
    console.log('  --files <n>          Number of files to list in context (default: 20)');
    console.log('  --json               Output context and rules as JSON');
    console.log('  --format <fmt>       Output format: text | jsonl (single-line {"prompt": ...})');
    console.log('  --out <file>         Write output to a file');
    console.log('  --quiet              Suppress success message when writing to file');
    console.log('  --append             Append to output file instead of overwrite');
    console.log('  --no-newline         Do not add a trailing newline when appending');
    console.log('  --stdout             Print success messages to STDOUT');
    console.log('  --stderr             Print success messages to STDERR');
    console.log('  --cwd <path>         Build prompt context from this directory');
    console.log('  --shell <name>       Override detected shell name (e.g., bash, zsh)');
    console.log('  --help               Show this help message and exit');
    console.log('\nExamples:');
    console.log('  os-prompt how to list all files');
    console.log('  os-prompt "How to create a folder"');
    console.log('  os-prompt --format text "How to check disk space"');
    console.log('  os-prompt --format jsonl "How to check disk space"');
    console.log('  os-prompt --out ./prompt.txt "How to check disk space"');
    console.log('  os-prompt --cwd ./src --format text "List files"');
    console.log('  os-prompt --shell bash --format text "List files"');
    process.exit(0);
  }

  // Parse flags
  let maxFiles: number | undefined;
  const asJson = args.includes('--json');
  let format: string | undefined;
  let outPath: string | undefined;
  const quiet = args.includes('--quiet');
  const append = args.includes('--append');
  const noNewline = args.includes('--no-newline');
  let cwdPath: string | undefined;
  let shellOverride: string | undefined;
  // Determine message stream (success messages only). If both provided, last wins.
  const idxStdout = args.indexOf('--stdout');
  const idxStderr = args.indexOf('--stderr');
  let messageStream: 'stdout' | 'stderr' = 'stdout';
  if (idxStdout === -1 && idxStderr !== -1) messageStream = 'stderr';
  else if (idxStderr === -1 && idxStdout !== -1) messageStream = 'stdout';
  else if (idxStdout !== -1 && idxStderr !== -1) messageStream = idxStdout > idxStderr ? 'stdout' : 'stderr';
  if (args.includes('--files')) {
    const idx = args.indexOf('--files');
    if (args.length > idx + 1) {
      const n = Number(args[idx + 1]);
      if (!Number.isNaN(n) && n > 0) {
        maxFiles = n;
      }
    }
  }
  if (args.includes('--format')) {
    const idx = args.indexOf('--format');
    if (args.length > idx + 1) {
      format = String(args[idx + 1]).trim().toLowerCase();
    }
  }
  if (args.includes('--out')) {
    const idx = args.indexOf('--out');
    if (args.length > idx + 1) {
      outPath = String(args[idx + 1]).trim();
    }
  }
  if (args.includes('--cwd')) {
    const idx = args.indexOf('--cwd');
    if (args.length > idx + 1) {
      cwdPath = String(args[idx + 1]).trim();
      // Validate directory
      try {
        const stat = fs.statSync(cwdPath);
        if (!stat.isDirectory()) {
          console.error(`Error: --cwd path is not a directory: ${cwdPath}`);
          process.exit(1);
        }
      } catch (e) {
        console.error(`Error: --cwd path does not exist or is not accessible: ${cwdPath}`);
        process.exit(1);
      }
    }
  }
  if (args.includes('--shell')) {
    const idx = args.indexOf('--shell');
    if (args.length > idx + 1) {
      shellOverride = String(args[idx + 1]).trim();
    }
  }

  // Extract question (exclude flags and their values)
  const flagsToRemove = ['--files', '--help', '--json', '--format', '--out', '--quiet', '--append', '--no-newline', '--stdout', '--stderr', '--cwd', '--shell'];
  const questionArgs = args.filter((arg, index) => {
    if (flagsToRemove.includes(arg)) return false;
    const prevArg = args[index - 1];
    if (prevArg && (prevArg === '--files' || prevArg === '--format' || prevArg === '--out' || prevArg === '--cwd' || prevArg === '--shell')) return false;
    return true;
  });

  if (questionArgs.length === 0) {
    console.error('Error: No question provided.');
    process.exit(1);
  }

  const question = questionArgs.join(' ');

  let output: string | undefined;
  if (format === 'jsonl') {
    const prompt = buildOsPrompt(question, { maxFiles, cwd: cwdPath, shell: shellOverride });
    output = JSON.stringify({ prompt });
  } else if (format === 'text') {
    const prompt = buildOsPrompt(question, { maxFiles, cwd: cwdPath, shell: shellOverride });
    output = prompt;
  } else if (asJson) {
    // Build raw context components
    const currentDir = cwdPath ?? process.cwd();
    const currentUser = os.userInfo().username;
    const currentOs = `${os.platform()} ${os.release()}`;
    const filesStr = getFilesList(currentDir, maxFiles ?? 20);
    const filesTruncated = filesStr.endsWith('...');
    const filesArray = filesStr === 'Error listing files'
      ? []
      : filesStr.replace(/\.{3}$/, '').split(', ').filter(Boolean);
    const gitRepo = isGitRepository(currentDir);
    const toolsStr = getInstalledTools();
    const toolsArray = toolsStr ? toolsStr.split(', ').filter(Boolean) : [];
    const shell = shellOverride ?? getCurrentTerminal();

    const rules = [
      `Primary Goal: Generate only the exact, executable shell command(s) for the \`${shell}\` environment.`,
      'Context is Key: Use the CONTEXT (CWD, Files, OS) to write specific, correct commands.',
      'No Banter: Do NOT include greetings, sign-offs, or conversational filler (e.g., "Here is the command:").',
      'Safety: If a command is complex or destructive (e.g., `rm -rf`, `find -delete`), add a single-line comment (`# ...`) after the command explaining what it does.',
      'Questions: If the user asks a question (e.g., "what is `ls`?"), provide a concise, one-line answer. Do not output a command.',
      'Ambiguity: If the request is unclear, ask a single, direct clarifying question. Start the line with `#`.'
    ];

    const prompt = buildOsPrompt(question, { maxFiles, cwd: cwdPath, shell: shellOverride });
    const payload = {
      system: {
        os: currentOs,
        shell,
        cwd: currentDir,
        user: currentUser,
        gitRepo,
        filesTop: filesArray,
        filesTruncated,
        availableTools: toolsArray,
      },
      rules,
      request: question,
      prompt,
    };

    output = JSON.stringify(payload, null, 2);
  } else {
    const prompt = buildOsPrompt(question, { maxFiles, cwd: cwdPath, shell: shellOverride });
    output = prompt;
  }

  // Write or print output
  if (outPath) {
    try {
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = output ?? '';
      if (append) {
        const suffix = noNewline ? '' : '\n';
        fs.appendFileSync(outPath, data + suffix, 'utf-8');
        if (!quiet) {
          const msg = `Appended output to ${outPath}`;
          if (messageStream === 'stderr') console.error(msg); else console.log(msg);
        }
      } else {
        fs.writeFileSync(outPath, data, 'utf-8');
        if (!quiet) {
          const msg = `Wrote output to ${outPath}`;
          if (messageStream === 'stderr') console.error(msg); else console.log(msg);
        }
      }
    } catch (err) {
      console.error(`Failed to write to ${outPath}: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  } else {
    if (format === 'jsonl') {
      process.stdout.write((output ?? '') + '\n');
    } else {
      console.log(output ?? '');
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\n💥 Unexpected error: ${error?.constructor?.name || 'Error'}: ${error?.message || error}`);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exit(1);
  });
}

export default buildOsPrompt;
