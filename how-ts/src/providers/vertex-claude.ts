/**
 * Vertex AI Claude Provider
 */

import { VertexAI } from '@google-cloud/vertexai';
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
      throw new Error('Vertex AI project ID is required. Set VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT environment variable.');
    }
    if (!this.location) {
      throw new Error('Vertex AI location is required. Set VERTEX_LOCATION environment variable.');
    }
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    const vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location,
    });

    // Get the model
    const generativeModel = vertexAI.getGenerativeModel({
      model: this.model,
    });

    const request = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  Project ID: ${this.projectId}`);
      console.log(`  Location: ${this.location}`);
      console.log(`  Timeout: ${TIMEOUT}ms`);
      console.log(`  Max Retries: ${MAX_RETRIES}`);
      console.log('\nRequest Body:');
      console.log(JSON.stringify(request, null, 2));
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
          const resultPromise = generativeModel.generateContent(request);
          const result = await Promise.race([resultPromise, timeoutPromise]);

          // Extract text from response
          const response = result.response;
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

          if (!text) {
            // Check for safety ratings or blocking
            const finishReason = response.candidates?.[0]?.finishReason;
            if (finishReason && finishReason !== 'STOP') {
              throw new ContentError(`Content generation stopped: ${finishReason}`);
            }
            throw new ContentError('Empty response from Vertex AI.');
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
          if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota') ||
              errorMessage.toLowerCase().includes('rate limit')) {
            if (attempt === MAX_RETRIES - 1) {
              throw new ApiError('Rate limit or quota exceeded.');
            }
            await this.sleep((Math.pow(2, attempt) + 1) * 1000);
            continue;
          }

          // Check for authentication/permission errors
          if (errorMessage.includes('403') || errorMessage.includes('401')) {
            throw new ApiError('Authentication or permission error. Check your Google Cloud credentials and project permissions.');
          }

          // Check for model not found
          if (errorMessage.includes('404')) {
            throw new ApiError(`Model not found: ${this.model}. Check that the model is available in region ${this.location}.`);
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
