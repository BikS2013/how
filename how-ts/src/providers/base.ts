/**
 * Base provider interface for AI services
 */

export interface BaseProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Generate a response from the AI model
   * @param prompt The prompt to send to the AI
   * @param silent Whether to suppress spinner/animations
   * @param verbose Whether to print verbose request details
   * @returns The generated response text
   */
  generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>;

  /**
   * Validate that the provider is properly configured
   * @throws Error if configuration is invalid or missing
   */
  validateConfig(): void;
}

/**
 * Provider configuration options
 */
export interface ProviderOptions {
  silent?: boolean;
  timeout?: number;
  maxRetries?: number;
}
