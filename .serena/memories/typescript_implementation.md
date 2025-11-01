# TypeScript Implementation Details: How-CLI-TS

**Last Updated**: 2025-11-01

## Overview

The TypeScript version (`how-ts/`) is an enhanced, type-safe reimplementation of the Python How-CLI with multi-provider support. It maintains the core functionality while adding significant architectural improvements.

---

## Project Structure

```
how-ts/
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration constants and environment variables
│   │   └── config-loader.ts  # Configuration file loading and resolution logic
│   ├── providers/
│   │   ├── base.ts           # BaseProvider interface definition
│   │   ├── gemini.ts         # Google Gemini implementation
│   │   ├── openai.ts         # OpenAI implementation
│   │   ├── azure-openai.ts   # Azure OpenAI implementation
│   │   ├── claude.ts         # Anthropic Claude implementation
│   │   ├── vertex-claude.ts  # Vertex AI Claude implementation
│   │   ├── factory.ts        # Provider factory and utilities
│   │   └── index.ts          # Provider exports
│   ├── utils/
│   │   ├── display.ts        # Display utilities (spinner, typewriter, etc.)
│   │   ├── history.ts        # History logging and retrieval
│   │   ├── system.ts         # System introspection (tools, terminal, files)
│   │   └── text.ts           # Text processing utilities
│   ├── errors/
│   │   └── index.ts          # Custom error classes
│   ├── index.ts              # Main CLI entry point
│   └── os-prompt.ts          # Standalone prompt generator utility
├── dist/                     # Compiled JavaScript output
├── package.json              # NPM package configuration
├── tsconfig.json             # TypeScript compiler configuration
└── README.md                 # Documentation
```

---

## Provider Implementations

### Base Provider Interface (`providers/base.ts`)

```typescript
export interface BaseProvider {
  readonly name: string;
  generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>;
  validateConfig(): void;
}
```

**Key Points**:
- All providers must implement this interface
- `generateResponse()` is async and returns Promise<string>
- `validateConfig()` throws errors if configuration is invalid
- `verbose` parameter for debugging requests

### Provider Factory (`providers/factory.ts`)

**Functions**:
1. `createProvider(config: ResolvedConfig): BaseProvider`
   - Switch-case based on `config.provider`
   - Instantiates appropriate provider class
   - Returns BaseProvider instance

2. `getSupportedProviders(): AIProvider[]`
   - Returns array of supported provider names

3. `getProviderName(provider: AIProvider): string`
   - Maps provider ID to display name

4. `isValidProvider(provider: string): boolean`
   - Type guard for provider validation

### Individual Providers

#### 1. GeminiProvider (`providers/gemini.ts`)

**Configuration**:
- API Key: Required
- Model: Default `models/gemini-2.5-flash-lite`

**SDK**: `@google/generative-ai`

**Key Features**:
- Retry logic with exponential backoff
- Rate limit handling (429 errors)
- Content filtering detection
- Timeout handling (30s default)

#### 2. OpenAIProvider (`providers/openai.ts`)

**Configuration**:
- API Key: Required
- Model: Default `gpt-4o-mini`
- Organization: Optional

**SDK**: `openai` (v4.70.0+)

**Key Features**:
- Chat completions API
- Streaming support (likely)
- Error handling for API errors

#### 3. AzureOpenAIProvider (`providers/azure-openai.ts`)

**Configuration**:
- API Key: Required
- Endpoint: Required (e.g., `https://your-resource.openai.azure.com`)
- API Version: Default `2024-02-15-preview`
- Deployment: Required (deployment name, not model name)

**SDK**: `openai` (configured for Azure)

**Key Differences from OpenAI**:
- Uses deployment name instead of model name
- Requires endpoint URL
- Different authentication mechanism

#### 4. ClaudeProvider (`providers/claude.ts`)

**Configuration**:
- API Key: Required
- Model: Default `claude-3-5-sonnet-20241022`

**SDK**: `@anthropic-ai/sdk` (v0.32.0+)

**Key Features**:
- Messages API
- Model name expansion (short names → full IDs)
- Support for latest Claude models

#### 5. VertexClaudeProvider (`providers/vertex-claude.ts`)

**Configuration**:
- Project ID: Required (GCP project)
- Location: Default `us-central1`
- Model: Default `claude-3-5-sonnet@20241022`

**SDK**: `@google-cloud/vertexai` (v1.9.0+)

**Authentication**: Google Application Default Credentials (ADC)

**Key Features**:
- Claude via Google Cloud
- Region selection
- Model format with `@` date version
- Short name expansion with date auto-addition
- Automatic retry with `--region global` if regional model unavailable

**Model Format**: `claude-<model>-<version>@YYYYMMDD`
- Example: `claude-sonnet-4-5@20250929`

---

## Configuration System

### Configuration Hierarchy (`config/config-loader.ts`)

**Resolution Order** (Highest → Lowest Priority):
1. **CLI Arguments**: `--provider`, `--model`, `--region`
2. **Environment Variables**: `AI_PROVIDER`, `OPENAI_API_KEY`, etc.
3. **Config File**: `~/.how-cli/config.json`
4. **Built-in Defaults**: Hardcoded fallbacks

### resolveConfig() Function

**Location**: `config/config-loader.ts:110-187`

**Process**:
1. Load config file (if exists)
2. For each provider, merge:
   - CLI args (if provided)
   - Environment variables
   - Config file values
   - Defaults
3. Apply model name expansion for Claude providers
4. Return `ResolvedConfig` object

### Model Name Expansion

**Claude Provider** (`expandClaudeModel()` at line 157):
```typescript
'sonnet-4-5' → 'claude-sonnet-4-5'
'haiku-4-5' → 'claude-haiku-4-5'
'opus-4-1' → 'claude-opus-4-1'
```

**Vertex Claude Provider** (`expandVertexClaudeModel()` at line 169):
```typescript
'sonnet-4-5' → 'claude-sonnet-4-5@20250929'
'haiku-4-5' → 'claude-haiku-4-5@20251001'
'opus-4-1' → 'claude-opus-4-1@20250805'
```

**When Expansion Happens**: During `resolveConfig()`, lines 183-184

---

## System Utilities (`utils/system.ts`)

### Functions

#### 1. `getInstalledTools(): string`
**Purpose**: Detect installed development tools

**Tools Checked**:
```typescript
['git', 'npm', 'node', 'python', 'docker', 'pip',
 'go', 'rustc', 'cargo', 'java', 'mvn', 'gradle']
```

**Implementation**:
- Uses `which` on Unix/macOS
- Uses `where` on Windows
- Executes via `execSync` from `child_process`
- Returns comma-separated list of found tools

#### 2. `getCurrentTerminal(): string`
**Purpose**: Identify the current terminal/shell

**Detection Strategy**:
1. Check `TERM_PROGRAM` env var (e.g., "iTerm.app", "vscode")
2. Check `SHELL` env var, extract basename
3. (Unix only) Execute `ps -p ${ppid} -o comm=` to get parent process name
4. Fallback: "Unknown"

#### 3. `getFilesList(directory: string, maxFiles: number = 20): string`
**Purpose**: List files in current directory for context

**Returns**: Comma-separated file list, with "..." if exceeds `maxFiles`

#### 4. `isGitRepository(directory: string): boolean`
**Purpose**: Check if directory is a git repository

**Implementation**: Check existence of `.git` subdirectory

---

## OS Prompt Utility (`os-prompt.ts`)

### Purpose
Generate the same context-wrapped prompt used by How-CLI without calling any AI model.

### Use Cases
1. **Tunneling to other AI systems**: Send prompt to Claude, ChatGPT, etc.
2. **Dataset generation**: Collect prompts for fine-tuning
3. **Debugging**: Inspect exact prompt sent to models
4. **Integration**: Use with custom agents or workflows

### CLI Flags

**Basic**:
- `--files <n>`: Number of files to list (default 20)

**Output Format**:
- (default): Plain text prompt
- `--json`: Structured JSON payload
- `--format jsonl`: Single-line JSON

**File Writing**:
- `--out <file>`: Write to file instead of stdout
- `--append`: Append to file (vs. overwrite)
- `--no-newline`: No trailing newline on append

**Context Overrides**:
- `--cwd <path>`: Use different directory for context
- `--shell <name>`: Override shell name in context

**Output Control**:
- `--quiet`: Suppress success messages
- `--stdout`: Print success to stdout
- `--stderr`: Print success to stderr (default)

### Output Formats

#### Text (Default)
```
SYSTEM:
You are an expert, concise shell assistant...

CONTEXT:
- OS: Darwin 25.0.0
- Shell: zsh
- CWD: /Users/...
...

REQUEST:
How to check disk space

RESPONSE:
```

#### JSON (`--json`)
```json
{
  "prompt": "SYSTEM:\nYou are an expert...",
  "context": {
    "os": "Darwin 25.0.0",
    "shell": "zsh",
    "cwd": "/Users/...",
    ...
  },
  "question": "How to check disk space"
}
```

#### JSONL (`--format jsonl`)
```json
{"prompt":"SYSTEM:\nYou are...","context":{...},"question":"How to check disk space"}
```

### Implementation Notes
- Shares context-building logic with main CLI
- No AI provider initialization
- Fast execution (no API calls)
- Can be used in pipelines: `os-prompt "..." | curl ...`

---

## Entry Points

### Main CLI (`index.ts`)

**Binary**: `how-ts` (defined in `package.json` bin field)

**Flow**:
1. Parse CLI arguments
   - Extract `--provider`, `--model`, `--region`, `--config`, etc.
   - Extract question from remaining args
2. Resolve configuration
   - Call `resolveConfig()` with CLI overrides
3. Create provider
   - Call `createProvider(config)`
4. Validate provider
   - Call `provider.validateConfig()`
5. Build context
   - Gather OS, shell, CWD, files, git status, tools
   - Construct prompt with context and rules
6. Generate response
   - Call `provider.generateResponse(prompt, silent, verbose)`
   - Show spinner if not silent
7. Display & save
   - Clean response (strip markdown)
   - Display (with typewriter if `--type`)
   - Copy to clipboard
   - Log to history
8. Error handling
   - Catch and display user-friendly errors
   - Exit with appropriate code

**Verbose Mode** (`--verbose`):
- Prints full request payload before API call
- Shows provider name, model, and prompt
- Useful for debugging

### OS Prompt (`os-prompt.ts`)

**Binary**: `os-prompt` (defined in `package.json` bin field)

**Flow**:
1. Parse CLI arguments
   - Extract output format, file path, context overrides
2. Build context
   - Same logic as main CLI
3. Construct prompt
   - Identical prompt template
4. Output
   - Format based on flags (text/JSON/JSONL)
   - Write to file or stdout
5. Success message
   - Print to stderr/stdout/quiet based on flags

---

## Build System

### TypeScript Configuration (`tsconfig.json`)

**Expected Settings**:
```json
{
  "compilerOptions": {
    "target": "ES2020",          // Modern JavaScript features
    "module": "commonjs",        // Node.js compatibility
    "outDir": "./dist",          // Compiled output
    "rootDir": "./src",          // Source directory
    "strict": true,              // Full type safety
    "esModuleInterop": true,     // Import compatibility
    "skipLibCheck": true,        // Faster compilation
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### NPM Scripts (`package.json`)

```json
{
  "scripts": {
    "build": "tsc",                    // Compile TS → JS
    "dev": "ts-node src/index.ts",     // Run without compilation
    "start": "node dist/index.js",     // Run compiled version
    "clean": "rm -rf dist"             // Remove build artifacts
  }
}
```

### Build Process
1. `npm run build`
   - TypeScript compiler reads `tsconfig.json`
   - Compiles all `.ts` files in `src/`
   - Outputs `.js` files to `dist/`
   - Preserves directory structure
2. Output is executable via:
   - `node dist/index.js` (direct)
   - `npm start` (via script)
   - `how-ts` (if globally linked with `npm link`)

---

## Key TypeScript Features Used

### 1. Union Types
```typescript
export type AIProvider = 'gemini' | 'openai' | 'azure' | 'claude' | 'vertex-claude';
```

### 2. Type Guards
```typescript
function isValidProvider(provider: string): provider is AIProvider {
  return getSupportedProviders().includes(provider as AIProvider);
}
```

### 3. Readonly Properties
```typescript
export interface BaseProvider {
  readonly name: string;  // Cannot be modified after creation
}
```

### 4. Optional Parameters
```typescript
generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>
```

### 5. Async/Await
```typescript
async generateResponse(prompt: string, silent: boolean): Promise<string> {
  const response = await this.client.messages.create({ ... });
  return response.content[0].text;
}
```

### 6. Interfaces for Configuration
```typescript
export interface ResolvedConfig {
  provider: AIProvider;
  gemini: { apiKey: string; model: string; };
  openai: { apiKey: string; model: string; organization: string; };
  // ...
}
```

### 7. Record Types
```typescript
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  // ...
};
```

---

## Advantages Over Python Version

### 1. Type Safety
- Compile-time error detection
- IDE autocomplete and refactoring
- Self-documenting code via types

### 2. Multi-Provider Architecture
- Easy to add new providers
- Provider-specific logic isolated
- Consistent interface across providers

### 3. Advanced Configuration
- Hierarchical config resolution
- File-based configuration
- CLI overrides

### 4. Modularity
- Separation of concerns
- Reusable utilities
- Testable components

### 5. Model Name Aliasing
- User-friendly short names
- Consistent UX across providers
- Automatic version resolution

### 6. Verbose Mode
- Debug request payloads
- Troubleshoot API issues
- Understand prompt construction

### 7. OS Prompt Utility
- Prompt generation without AI calls
- Integration with other tools
- Dataset creation

---

## Future Enhancement Areas

### 1. Testing
- Add Jest or Vitest
- Unit tests for providers
- Integration tests for CLI

### 2. Additional Providers
- Cohere
- Mistral AI
- Local models (Ollama, LLaMA.cpp)

### 3. Advanced Features
- Streaming responses
- Multi-turn conversations
- Command explanations
- Safety confirmations for destructive commands

### 4. Configuration UI
- Interactive setup wizard
- Config validation command
- List available models per provider

### 5. Improved Error Messages
- Suggest fixes for common errors
- Link to documentation
- Provider-specific troubleshooting

---

## Migration Notes (Python → TypeScript)

### What Changed
- **Architecture**: Monolithic → Modular
- **Providers**: Single (Gemini) → Multi (5 providers)
- **Configuration**: Simple → Hierarchical
- **Type System**: Dynamic → Static
- **Async**: Threading → async/await

### What Stayed the Same
- **Core Concept**: Context-aware command generation
- **Prompt Structure**: Identical system prompt and rules
- **User Experience**: Same CLI flags and behavior
- **Output**: Minimal, command-only responses

### Breaking Changes
- CLI binary name: `how` → `how-ts`
- Config file: New JSON format (Python had only API key file)
- Provider selection: New `--provider` flag required for non-Gemini

### Backward Compatibility
- Environment variable `GOOGLE_API_KEY` still works
- History file location unchanged (`~/.how-cli/history.log`)
- Similar CLI flags (`--silent`, `--type`, `--history`)