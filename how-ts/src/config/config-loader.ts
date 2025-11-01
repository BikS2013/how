/**
 * Configuration file loader for How-CLI
 * Supports loading provider configuration from JSON file
 */

import * as fs from 'fs';
import { CONFIG_FILE, AIProvider, PROVIDER_CONFIG } from './index';

export interface ProviderConfig {
  provider?: AIProvider;
  gemini?: {
    apiKey?: string;
    model?: string;
  };
  openai?: {
    apiKey?: string;
    model?: string;
    organization?: string;
  };
  azure?: {
    apiKey?: string;
    endpoint?: string;
    apiVersion?: string;
    deployment?: string;
  };
  claude?: {
    apiKey?: string;
    model?: string;
  };
  vertexClaude?: {
    projectId?: string;
    location?: string;
    model?: string;
  };
}

export interface ResolvedConfig {
  provider: AIProvider;
  gemini: {
    apiKey: string;
    model: string;
  };
  openai: {
    apiKey: string;
    model: string;
    organization: string;
  };
  azure: {
    apiKey: string;
    endpoint: string;
    apiVersion: string;
    deployment: string;
  };
  claude: {
    apiKey: string;
    model: string;
  };
  vertexClaude: {
    projectId: string;
    location: string;
    model: string;
  };
}

/**
 * Load configuration from file
 */
export function loadConfigFile(configPath?: string): ProviderConfig | null {
  const path = configPath || CONFIG_FILE;

  if (!fs.existsSync(path)) {
    return null;
  }

  try {
    const content = fs.readFileSync(path, 'utf-8');
    const config = JSON.parse(content) as ProviderConfig;
    return config;
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

/**
 * Save configuration to file
 */
export function saveConfigFile(config: ProviderConfig, configPath?: string): void {
  const path = configPath || CONFIG_FILE;

  try {
    const dir = require('path').dirname(path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to save config file: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Merge configurations with priority:
 * 1. CLI arguments (highest priority)
 * 2. Environment variables
 * 3. Config file
 * 4. Defaults (lowest priority)
 */
export function resolveConfig(
  cliProvider?: AIProvider,
  cliModel?: string,
  configFilePath?: string
): ResolvedConfig {
  // Load config file
  const fileConfig = loadConfigFile(configFilePath);

  // Determine provider (CLI > Env > File > Default)
  const provider = cliProvider || PROVIDER_CONFIG.provider || fileConfig?.provider || 'gemini';

  // Merge configurations for each provider
  const config: ResolvedConfig = {
    provider,

    gemini: {
      apiKey: PROVIDER_CONFIG.gemini.apiKey || fileConfig?.gemini?.apiKey || '',
      model: cliModel || PROVIDER_CONFIG.gemini.model || fileConfig?.gemini?.model || 'models/gemini-2.5-flash-lite',
    },

    openai: {
      apiKey: PROVIDER_CONFIG.openai.apiKey || fileConfig?.openai?.apiKey || '',
      model: cliModel || PROVIDER_CONFIG.openai.model || fileConfig?.openai?.model || 'gpt-4o-mini',
      organization: PROVIDER_CONFIG.openai.organization || fileConfig?.openai?.organization || '',
    },

    azure: {
      apiKey: PROVIDER_CONFIG.azure.apiKey || fileConfig?.azure?.apiKey || '',
      endpoint: PROVIDER_CONFIG.azure.endpoint || fileConfig?.azure?.endpoint || '',
      apiVersion: PROVIDER_CONFIG.azure.apiVersion || fileConfig?.azure?.apiVersion || '2024-02-15-preview',
      deployment: cliModel || PROVIDER_CONFIG.azure.deployment || fileConfig?.azure?.deployment || '',
    },

    claude: {
      apiKey: PROVIDER_CONFIG.claude.apiKey || fileConfig?.claude?.apiKey || '',
      model: cliModel || PROVIDER_CONFIG.claude.model || fileConfig?.claude?.model || 'claude-3-5-sonnet-20241022',
    },

    vertexClaude: {
      projectId: PROVIDER_CONFIG.vertexClaude.projectId || fileConfig?.vertexClaude?.projectId || '',
      location: PROVIDER_CONFIG.vertexClaude.location || fileConfig?.vertexClaude?.location || 'us-east5',
      model: cliModel || PROVIDER_CONFIG.vertexClaude.model || fileConfig?.vertexClaude?.model || 'claude-3-5-sonnet@20241022',
    },
  };

  return config;
}
