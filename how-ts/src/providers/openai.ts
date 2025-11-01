/**
 * OpenAI Provider
 */

import OpenAI from 'openai';
import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';

export class OpenAIProvider implements BaseProvider {
  public readonly name = 'OpenAI';
  private apiKey: string;
  private model: string;
  private organization?: string;

  constructor(apiKey: string, model: string, organization?: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.organization = organization;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    const client = new OpenAI({
      apiKey: this.apiKey,
      organization: this.organization,
    });

    const requestConfig = {
      model: this.model,
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_completion_tokens: 5000,
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      if (this.organization) {
        console.log(`  Organization: ${this.organization}`);
      }
      console.log(`  Temperature: ${requestConfig.temperature}`);
      console.log(`  Max Completion Tokens: ${requestConfig.max_completion_tokens}`);
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
          const completionPromise = client.chat.completions.create(requestConfig);

          const completion = await Promise.race([completionPromise, timeoutPromise]);

          const text = completion.choices[0]?.message?.content?.trim() || '';

          if (!text) {
            // Check for content filtering
            if (completion.choices[0]?.finish_reason === 'content_filter') {
              throw new ContentError('Content blocked by OpenAI content filter.');
            }
            throw new ContentError('Empty response from API.');
          }

          return text;

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

          // Check for authentication errors
          if (error?.status === 401) {
            throw new ApiError('Invalid API key.');
          }

          // Check for content filter
          if (errorMessage.toLowerCase().includes('content_filter')) {
            throw new ContentError('Content blocked by content filter.');
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
