/**
 * Vertex AI Claude Provider
 * Uses Anthropic SDK with Vertex AI configuration
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';

export class VertexClaudeProvider implements BaseProvider {
  public readonly name = 'Vertex AI Claude';
  private projectId: string;
  private location: string;
  private model: string;

  constructor(projectId: string, location: string, model: string) {
    this.projectId = projectId;
    this.location = location;
    this.model = model;
  }

  validateConfig(): void {
    if (!this.projectId) {
      throw new Error('Vertex AI project ID is required. Set ANTHROPIC_VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable.');
    }
    if (!this.location) {
      throw new Error('Vertex AI location is required. Set VERTEX_LOCATION or CLOUD_ML_REGION environment variable.');
    }

    // Validate model format (should include @ symbol for Vertex AI)
    if (!this.model.includes('@')) {
      const suggestion = this.getSuggestedModel(this.model);
      throw new Error(
        `Invalid Vertex AI model format: "${this.model}"\n` +
        `Vertex AI requires the @ symbol with a date version.\n` +
        `${suggestion ? `Did you mean: "${suggestion}"?\n` : ''}` +
        `Valid examples:\n` +
        `  - claude-sonnet-4-5@20250929\n` +
        `  - claude-haiku-4-5@20251001\n` +
        `  - claude-opus-4-1@20250805`
      );
    }
  }

  private getSuggestedModel(invalidModel: string): string | null {
    // Map common mistakes to correct Vertex AI model names
    const modelMap: Record<string, string> = {
      'claude-sonnet-4-5': 'claude-sonnet-4-5@20250929',
      'claude-sonnet-4.5': 'claude-sonnet-4-5@20250929',
      'claude-haiku-4-5': 'claude-haiku-4-5@20251001',
      'claude-haiku-4.5': 'claude-haiku-4-5@20251001',
      'claude-opus-4-1': 'claude-opus-4-1@20250805',
      'claude-opus-4.1': 'claude-opus-4-1@20250805',
      'claude-sonnet-4': 'claude-sonnet-4@20250514',
      'claude-opus-4': 'claude-opus-4@20250514',
      'claude-3-5-sonnet': 'claude-3-5-sonnet@20241022',
      'claude-3-5-haiku': 'claude-3-5-haiku@20241022',
    };

    return modelMap[invalidModel] || null;
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    // Initialize Anthropic client with Vertex AI configuration
    const client = new Anthropic({
      baseURL: `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/anthropic/models/${this.model}:streamRawPredict`,
      // Vertex AI uses Google Cloud credentials, not an API key
      apiKey: 'unused', // Required by SDK but not used for Vertex AI
    });

    const requestConfig = {
      model: this.model,
      max_tokens: 5000,
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      // Vertex-specific parameter
      anthropic_version: 'vertex-2023-10-16',
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  Project ID: ${this.projectId}`);
      console.log(`  Location: ${this.location}`);
      console.log(`  Max Tokens: ${requestConfig.max_tokens}`);
      console.log(`  Anthropic Version: ${requestConfig.anthropic_version}`);
      console.log(`  Timeout: ${TIMEOUT}ms`);
      console.log(`  Max Retries: ${MAX_RETRIES}`);
      console.log('\nVertex AI Endpoint:');
      console.log(`  ${client.baseURL}`);
      console.log('\nRequest Body:');
      console.log(JSON.stringify({
        model: this.model,
        max_tokens: requestConfig.max_tokens,
        messages: requestConfig.messages,
        anthropic_version: requestConfig.anthropic_version,
      }, null, 2));
    }

    // Start spinner if not in silent mode
    const spinnerInstance = silent ? null : spinner('Generating');
    if (spinnerInstance) {
      spinnerInstance.start();
    }

    try {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Create a timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), TIMEOUT);
          });

          if (verbose && attempt > 0) {
            console.log(`\nRetry attempt ${attempt + 1}/${MAX_RETRIES}...`);
          }

          // Race between API call and timeout
          const messagePromise = client.messages.create(requestConfig as any);

          const message = await Promise.race([messagePromise, timeoutPromise]);

          // Extract text from content blocks
          const textContent = message.content
            .filter((block) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n')
            .trim();

          if (!textContent) {
            // Check for stop reason
            if (message.stop_reason === 'end_turn') {
              throw new ContentError('Empty response from API.');
            }
            throw new ContentError(`No text content in response. Stop reason: ${message.stop_reason}`);
          }

          return textContent;

        } catch (error: any) {
          const errorMessage = error?.message || String(error);

          // Check for timeout
          if (errorMessage.includes('Timeout')) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiTimeoutError('API request timed out.');
            }
            await this.sleep(Math.pow(2, attempt) * 1000);
            continue;
          }

          // Check for rate limiting
          if (error?.status === 429 || errorMessage.includes('rate limit')) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiError('Rate limit exceeded.');
            }
            await this.sleep((Math.pow(2, attempt) + 1) * 1000);
            continue;
          }

          // Check for authentication/permission errors
          if (error?.status === 401 || error?.status === 403) {
            throw new ApiError(
              'Authentication or permission error. Ensure you have:\n' +
              '  1. Run: gcloud auth application-default login\n' +
              '  2. Enabled Vertex AI API in your project\n' +
              '  3. Granted necessary permissions to your account'
            );
          }

          // Check for model not found
          if (error?.status === 404 || errorMessage.includes('not found')) {
            throw new ApiError(
              `Model not found: ${this.model}. Check that the model is available in region ${this.location}.\n` +
              `Solutions:\n` +
              `  1. Try --region global (recommended for Claude 4.5+ models)\n` +
              `  2. Try a different region: us-central1, us-east1, europe-west1\n` +
              `  3. Use an older model: claude-3-5-sonnet@20241022\n` +
              `\nExample: node dist/index.js --provider vertex-claude --region global --model ${this.model} "your question"`
            );
          }

          // Unknown error
          throw new ApiError(`${errorMessage} (${error?.constructor?.name || 'Error'})`);
        }
      }

      throw new ApiError('Max retries exceeded.');

    } finally {
      // Stop spinner
      if (spinnerInstance) {
        spinnerInstance.stop();
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
