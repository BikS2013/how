/**
 * Provider factory for creating AI provider instances
 */

import { BaseProvider } from './base';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AzureOpenAIProvider } from './azure-openai';
import { ClaudeProvider } from './claude';
import { VertexClaudeProvider } from './vertex-claude';
import { AIProvider, PROVIDER_NAMES } from '../config';
import { ResolvedConfig } from '../config/config-loader';

/**
 * Create a provider instance based on configuration
 */
export function createProvider(config: ResolvedConfig): BaseProvider {
  const provider = config.provider;

  switch (provider) {
    case 'gemini':
      return new GeminiProvider(
        config.gemini.apiKey,
        config.gemini.model
      );

    case 'openai':
      return new OpenAIProvider(
        config.openai.apiKey,
        config.openai.model,
        config.openai.organization || undefined
      );

    case 'azure':
      return new AzureOpenAIProvider(
        config.azure.apiKey,
        config.azure.endpoint,
        config.azure.apiVersion,
        config.azure.deployment
      );

    case 'claude':
      return new ClaudeProvider(
        config.claude.apiKey,
        config.claude.model
      );

    case 'vertex-claude':
      return new VertexClaudeProvider(
        config.vertexClaude.projectId,
        config.vertexClaude.location,
        config.vertexClaude.model
      );

    default:
      throw new Error(`Unknown provider: ${provider}. Supported providers: ${Object.keys(PROVIDER_NAMES).join(', ')}`);
  }
}

/**
 * Get list of supported providers
 */
export function getSupportedProviders(): AIProvider[] {
  return ['gemini', 'openai', 'azure', 'claude', 'vertex-claude'];
}

/**
 * Get provider display name
 */
export function getProviderName(provider: AIProvider): string {
  return PROVIDER_NAMES[provider] || provider;
}

/**
 * Validate provider name
 */
export function isValidProvider(provider: string): provider is AIProvider {
  return getSupportedProviders().includes(provider as AIProvider);
}
