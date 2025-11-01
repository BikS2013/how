/**
 * Azure OpenAI Provider
 */

import { AzureOpenAI } from 'openai';
import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';

export class AzureOpenAIProvider implements BaseProvider {
  public readonly name = 'Azure OpenAI';
  private apiKey: string;
  private endpoint: string;
  private apiVersion: string;
  private deployment: string;

  constructor(apiKey: string, endpoint: string, apiVersion: string, deployment: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.apiVersion = apiVersion;
    this.deployment = deployment;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('Azure OpenAI API key is required. Set AZURE_OPENAI_API_KEY environment variable.');
    }
    if (!this.endpoint) {
      throw new Error('Azure OpenAI endpoint is required. Set AZURE_OPENAI_ENDPOINT environment variable.');
    }
    if (!this.deployment) {
      throw new Error('Azure OpenAI deployment name is required. Set AZURE_OPENAI_DEPLOYMENT environment variable.');
    }
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    const client = new AzureOpenAI({
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      apiVersion: this.apiVersion,
    });

    const requestConfig = {
      model: this.deployment, // Azure uses deployment name as model
      messages: [
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      max_completion_tokens: 5000,
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Deployment: ${this.deployment}`);
      console.log(`  API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log(`  Endpoint: ${this.endpoint}`);
      console.log(`  API Version: ${this.apiVersion}`);
      console.log(`  Max Completion Tokens: ${requestConfig.max_completion_tokens}`);
      console.log(`  Temperature: (using model default)`);
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
          // Note: Newer Azure OpenAI API versions use max_completion_tokens instead of max_tokens
          // Some models don't support custom temperature, so we omit it to use the default
          const completionPromise = client.chat.completions.create(requestConfig);

          const completion = await Promise.race([completionPromise, timeoutPromise]);

          const text = completion.choices[0]?.message?.content?.trim() || '';

          if (!text) {
            // Check for content filtering
            if (completion.choices[0]?.finish_reason === 'content_filter') {
              throw new ContentError('Content blocked by Azure OpenAI content filter.');
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
            throw new ApiError('Invalid Azure OpenAI API key or endpoint.');
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
