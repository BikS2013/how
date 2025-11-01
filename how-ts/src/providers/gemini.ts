/**
 * Google Gemini AI Provider
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';

export class GeminiProvider implements BaseProvider {
  public readonly name = 'Google Gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error('Google Gemini API key is required. Set GOOGLE_API_KEY environment variable or use --api-key flag.');
    }
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const modelInstance = genAI.getGenerativeModel({ model: this.model });

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  API Key: ${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
      console.log(`  Timeout: ${TIMEOUT}ms`);
      console.log(`  Max Retries: ${MAX_RETRIES}`);
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

          // Race between API call and timeout
          const resultPromise = modelInstance.generateContent(prompt);

          if (verbose && attempt > 0) {
            console.log(`\nRetry attempt ${attempt + 1}/${MAX_RETRIES}...`);
          }

          const result = await Promise.race([resultPromise, timeoutPromise]);

          const response = await result.response;
          const text = response.text()?.trim() || '';

          if (!text) {
            // Check for content blocking
            const promptFeedback = response.promptFeedback;
            if (promptFeedback?.blockReason) {
              throw new ContentError(`Blocked: ${promptFeedback.blockReason}`);
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
          if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('resourceexhausted')) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiError('Rate limit exceeded.');
            }
            await this.sleep((Math.pow(2, attempt) + 1) * 1000);
            continue;
          }

          // Check for content blocking
          if (errorMessage.toLowerCase().includes('block') || errorMessage.toLowerCase().includes('safety')) {
            throw new ContentError('Content blocked or stopped early.');
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
