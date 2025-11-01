/**
 * Anthropic Claude Provider
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';

export class ClaudeProvider implements BaseProvider {
  public readonly name = 'Anthropic Claude';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }

    // Auto-expand short model names (e.g., sonnet-4-5 → claude-sonnet-4-5)
    this.model = this.expandShortModel(this.model);
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    const client = new Anthropic({
      apiKey: this.apiKey,
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
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log(`  Max Tokens: ${requestConfig.max_tokens}`);
      console.log(`  Timeout: ${TIMEOUT}ms`);
      console.log(`  Max Retries: ${MAX_RETRIES}`);
      console.log('\nRequest Body:');
      console.log(JSON.stringify(requestConfig, null, 2));
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
          const messagePromise = client.messages.create(requestConfig);

          const message = await Promise.race([messagePromise, timeoutPromise]);

          // Extract text from content blocks
          const textContent = message.content
            .filter((block) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n')
            .trim();

          if (!textContent) {
            // Check stop reason
            if (message.stop_reason === 'end_turn') {
              throw new ContentError('Empty response from Claude API.');
            }
            throw new ContentError(`Unexpected stop reason: ${message.stop_reason}`);
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
          if (error?.status === 429 || errorMessage.includes('rate_limit')) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiError('Rate limit exceeded.');
            }
            await this.sleep((Math.pow(2, attempt) + 1) * 1000);
            continue;
          }

          // Check for authentication errors
          if (error?.status === 401) {
            throw new ApiError('Invalid Anthropic API key.');
          }

          // Check for overloaded errors
          if (error?.status === 529) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiError('API is overloaded. Please try again later.');
            }
            await this.sleep((Math.pow(2, attempt) + 1) * 1000);
            continue;
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

  /**
   * Expand short Anthropic model names to full IDs for the Claude provider.
   * Examples:
   *  - sonnet-4-5 → claude-sonnet-4-5
   *  - haiku-4-5  → claude-haiku-4-5
   *  - opus-4-1   → claude-opus-4-1
   */
  private expandShortModel(model: string): string {
    const map: Record<string, string> = {
      'sonnet-4-5': 'claude-sonnet-4-5',
      'haiku-4-5': 'claude-haiku-4-5',
      'opus-4-1': 'claude-opus-4-1',
      // Optional older mappings for convenience
      'sonnet-3-5': 'claude-3-5-sonnet-20241022',
      'haiku-3-5': 'claude-3-5-haiku-20241022',
    };

    // If already looks complete, return as is
    if (model.startsWith('claude-')) {
      return model;
    }

    return map[model] || model;
  }
}
