/**
 * Vertex AI Claude Provider
 * Calls Vertex AI Anthropic models via rawPredict with Google auth
 */

import { BaseProvider } from './base';
import { TIMEOUT, MAX_RETRIES } from '../config';
import { ApiError, ContentError, ApiTimeoutError } from '../errors';
import { spinner } from '../utils/display';
import { GoogleAuth } from 'google-auth-library';

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

    // Validate model format (should include @ symbol for Vertex AI). Auto-expand when possible.
    if (!this.model.includes('@')) {
      const suggestion = this.getSuggestedModel(this.model);
      if (suggestion) {
        // Auto-expand short or missing-date model names
        this.model = suggestion;
        return;
      }
      throw new Error(
        `Invalid Vertex AI model format: "${this.model}"\n` +
        `Vertex AI requires the @ symbol with a date version.\n` +
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
      // Short names → full Vertex model IDs with version
      'sonnet-4-5': 'claude-sonnet-4-5@20250929',
      'haiku-4-5': 'claude-haiku-4-5@20251001',
      'opus-4-1': 'claude-opus-4-1@20250805',
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

  /**
   * Prewarm Google ADC by fetching an access token ahead of the first API call.
   */
  async prewarm(): Promise<void> {
    this.validateConfig();
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const authClient = await auth.getClient();
    await authClient.getAccessToken();
  }

  async generateResponse(prompt: string, silent: boolean = false, verbose: boolean = false): Promise<string> {
    this.validateConfig();

    // Prepare auth client
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const authClient = await auth.getClient();

    // Helper to build endpoint URL
    const buildUrl = (location: string): string => {
      // Use regional host; for global, still use regional host but path location=global
      const host = location === 'global' ? 'us-central1-aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
      return `https://${host}/v1/projects/${this.projectId}/locations/${location}/publishers/anthropic/models/${this.model}:rawPredict`;
    };

    // Request payload for Vertex AI Anthropic models
    const requestBody = {
      anthropic_version: 'vertex-2023-10-16',
      max_tokens: 5000,
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: prompt,
            },
          ],
        },
      ],
    };

    // Print verbose request details
    if (verbose) {
      console.log('Request Configuration:');
      console.log(`  Model: ${this.model}`);
      console.log(`  Project ID: ${this.projectId}`);
      console.log(`  Location: ${this.location}`);
      console.log(`  Max Tokens: ${requestBody.max_tokens}`);
      console.log(`  Anthropic Version: ${requestBody.anthropic_version}`);
      console.log(`  Timeout: ${TIMEOUT}ms`);
      console.log(`  Max Retries: ${MAX_RETRIES}`);
      console.log('\nVertex AI Endpoint:');
      console.log(`  ${buildUrl(this.location)}`);
      console.log('\nRequest Body:');
      console.log(JSON.stringify(requestBody, null, 2));
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
          const accessToken = await authClient.getAccessToken();
          const url = buildUrl(this.location);

          const fetchPromise = fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken?.token || accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }).then(async (res) => {
            const body = await res.text();
            let json: any = {};
            try { json = body ? JSON.parse(body) : {}; } catch { /* leave json empty for error path */ }

            if (!res.ok) {
              // If model not found, attempt global fallback once (on next retry)
              const message = json?.error?.message || res.statusText || 'Unknown error';
              const err: any = new Error(message);
              err.status = res.status;
              err.vertexResponse = json;
              throw err;
            }
            return json;
          });

          const response: any = await Promise.race([fetchPromise, timeoutPromise]);

          // Extract text from content blocks in Vertex AI Anthropic response
          const contentBlocks = Array.isArray(response?.content) ? response.content : [];
          const textContent = contentBlocks
            .filter((block: any) => block?.type === 'text' && typeof block?.text === 'string')
            .map((block: any) => block.text)
            .join('\n')
            .trim();

          if (!textContent) {
            // Check stop reason
            const stopReason = response?.stop_reason || 'unknown';
            throw new ContentError(`No text content in response. Stop reason: ${stopReason}`);
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

          // Check for model not found → retry once with global region fallback
          if ((error?.status === 404 || errorMessage.toLowerCase().includes('not found')) && this.location !== 'global') {
            if (verbose) {
              console.log(`Model not found in region ${this.location}. Retrying with global region...`);
            }
            // Sleep briefly before retrying with global
            await this.sleep(250);
            this.location = 'global';
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
}
