/**
 * Configuration constants for How-CLI
 */

import * as path from 'path';
import * as os from 'os';

// Directory and file paths
export const CONFIG_DIR = path.join(os.homedir(), '.how-cli');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
export const HISTORY_FILE = path.join(CONFIG_DIR, 'history.log');

// General settings
export const TIMEOUT = 30000; // 30 seconds in milliseconds
export const MAX_RETRIES = 3;

// Provider selection
export type AIProvider = 'gemini' | 'openai' | 'azure' | 'claude' | 'vertex-claude';
export const DEFAULT_PROVIDER: AIProvider = 'gemini';

// Provider configuration from environment variables
export const PROVIDER_CONFIG = {
  // Selected provider
  provider: (process.env.AI_PROVIDER || DEFAULT_PROVIDER) as AIProvider,

  // Google Gemini
  gemini: {
    apiKey: process.env.GOOGLE_API_KEY || '',
    model: process.env.HOW_MODEL || process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-lite',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    organization: process.env.OPENAI_ORGANIZATION || '',
  },

  // Azure OpenAI
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  },

  // Anthropic Claude
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  },

  // Vertex AI Claude
  vertexClaude: {
    projectId: process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '',
    location: process.env.VERTEX_LOCATION || 'us-east5',
    model: process.env.VERTEX_CLAUDE_MODEL || 'claude-3-5-sonnet@20241022',
  },
};

// Provider display names
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  claude: 'Anthropic Claude',
  'vertex-claude': 'Vertex AI Claude',
};
