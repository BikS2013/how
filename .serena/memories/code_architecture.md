# Code Architecture: How-CLI

**Last Updated**: 2025-11-01

## Python Version Architecture (`how/`)

### File Structure
```
how/
├── how/
│   ├── __init__.py          # Package initialization (empty)
│   └── main.py              # Main CLI logic (270 lines)
└── pyproject.toml           # Package configuration
```

### Main Components (`how/main.py`)

#### 1. **Error Classes** (Lines 25-28)
```python
class ApiError(Exception): pass
class AuthError(ApiError): pass
class ContentError(ApiError): pass
class ApiTimeoutError(ApiError): pass
```

#### 2. **Configuration** (Lines 19-22)
- `CONFIG_DIR`: `~/.how-cli`
- `API_KEY_FILE`: `~/.how-cli/.google_api_key`
- `HISTORY_FILE`: `~/.how-cli/history.log`
- `MODEL_NAME`: Environment variable `HOW_MODEL` or default `models/gemini-2.5-flash-lite`

#### 3. **Core Functions**

**System Introspection** (Lines 85-97):
- `get_installed_tools()`: Detects git, npm, python, docker, etc.
- `get_current_terminal()`: Identifies terminal/shell using psutil

**API Key Management** (Lines 99-123):
- `get_or_create_api_key()`: Retrieves from env, file, or prompts user
- Stores with 0o600 permissions

**Response Generation** (Lines 126-164):
- `generate_response()`: Calls Gemini API with retry logic
- Uses ThreadPoolExecutor for timeout handling
- Exponential backoff on rate limits (429 errors)
- Spinner animation during API calls

**History & Display** (Lines 61-82):
- `log_history()`: Appends to history.log with timestamps
- `show_history()`: Displays command history
- `clean_response()`: Strips markdown code blocks
- `spinner()`: Animated loading indicator

#### 4. **Main Entry Point** (`main()`, Lines 167-263)

**Flow**:
1. Parse CLI arguments (`--silent`, `--type`, `--history`, `--api-key`, `--help`)
2. Handle special flags (history display, API key management)
3. Get/validate API key
4. Gather system context (OS, shell, CWD, files, git status, tools)
5. Build prompt with context and rules
6. Call AI provider
7. Clean and display response
8. Copy to clipboard
9. Log to history

---

## TypeScript Version Architecture (`how-ts/`)

### File Structure
```
how-ts/
├── src/
│   ├── config/
│   │   ├── index.ts          # Constants & env vars
│   │   └── config-loader.ts  # Config file management
│   ├── providers/
│   │   ├── base.ts           # Provider interface
│   │   ├── gemini.ts         # Google Gemini
│   │   ├── openai.ts         # OpenAI
│   │   ├── azure-openai.ts   # Azure OpenAI
│   │   ├── claude.ts         # Anthropic Claude
│   │   ├── vertex-claude.ts  # Vertex AI Claude
│   │   ├── factory.ts        # Provider factory
│   │   └── index.ts          # Provider exports
│   ├── utils/
│   │   ├── display.ts        # Output formatting
│   │   ├── history.ts        # History management
│   │   ├── system.ts         # System introspection
│   │   └── text.ts           # Text processing
│   ├── errors/
│   │   └── index.ts          # Custom error classes
│   ├── index.ts              # Main CLI entry point
│   └── os-prompt.ts          # Prompt-only utility
├── dist/                     # Compiled JavaScript
├── package.json
└── tsconfig.json
```

### Design Patterns

#### 1. **Provider Pattern** (`providers/`)

**Interface** (`base.ts`):
```typescript
interface BaseProvider {
  readonly name: string;
  generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>;
  validateConfig(): void;
}
```

**Factory** (`factory.ts`):
- `createProvider()`: Instantiates provider based on config
- `getSupportedProviders()`: Returns available providers
- `isValidProvider()`: Validates provider name

**Implementations**:
- `GeminiProvider`: Google Generative AI
- `OpenAIProvider`: OpenAI API
- `AzureOpenAIProvider`: Azure OpenAI
- `ClaudeProvider`: Anthropic SDK
- `VertexClaudeProvider`: Google Cloud Vertex AI

#### 2. **Configuration Hierarchy** (`config/`)

**Priority** (Highest → Lowest):
1. CLI Arguments (`--provider`, `--model`, `--region`)
2. Environment Variables
3. Config File (`~/.how-cli/config.json`)
4. Defaults

**Resolution** (`config-loader.ts:110-187`):
- `resolveConfig()`: Merges all sources
- `loadConfigFile()`: Reads JSON config
- `saveConfigFile()`: Writes config
- Model name expansion for Claude providers

#### 3. **System Context** (`utils/system.ts`)

**Functions**:
- `getInstalledTools()`: Cross-platform tool detection (which/where)
- `getCurrentTerminal()`: Reads TERM_PROGRAM, SHELL, or process info
- `getFilesList()`: Directory listing with limit
- `isGitRepository()`: Checks for .git directory

#### 4. **Separation of Concerns**

**Main CLI** (`index.ts`):
- Argument parsing
- Configuration resolution
- Provider initialization
- Prompt construction
- Response handling

**OS Prompt Utility** (`os-prompt.ts`):
- Generates context-wrapped prompts without AI calls
- Supports multiple output formats (text, JSON, JSONL)
- File writing with append mode
- Useful for tunneling to other AI systems

### Key Architectural Differences from Python

| Aspect | Python | TypeScript |
|--------|--------|------------|
| **Providers** | Single (Gemini) | Multi-provider (5 providers) |
| **Type Safety** | Dynamic typing | Full TypeScript types |
| **Configuration** | Env vars + API key file | Env + File + CLI with hierarchy |
| **Structure** | Single file (270 lines) | Modular (separate concerns) |
| **Error Handling** | Custom exceptions | TypeScript errors + validation |
| **Model Selection** | Env var only | CLI flag + Env + Config + Short names |
| **Extensibility** | Monolithic | Provider interface for easy additions |

### Data Flow

**TypeScript Main Flow**:
```
CLI Args → Config Resolution → Provider Factory → Provider Instance
                                                         ↓
System Context → Prompt Builder → Provider.generateResponse()
                                                         ↓
Response → Clean → Display → Clipboard → History
```

**Configuration Flow**:
```
CLI --provider=X --model=Y
         ↓
resolveConfig() merges:
  1. CLI args
  2. Environment variables (PROVIDER_CONFIG)
  3. Config file (~/.how-cli/config.json)
  4. Defaults
         ↓
ResolvedConfig object → createProvider() → BaseProvider instance
```