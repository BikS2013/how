# Dependencies and Tech Stack: How-CLI

**Last Updated**: 2025-11-01

## Python Version (`how/`)

### Package Information
- **Package Name**: `how-cli-assist`
- **Version**: 1.0.1
- **Minimum Python**: 3.8+
- **Build System**: setuptools
- **Package Manager**: pip/uv

### Dependencies (`pyproject.toml`)

#### Runtime Dependencies
1. **google-generativeai**
   - Purpose: Google Gemini API client
   - Usage: Main AI provider for command generation
   - Location: `how/main.py:5` (import), `main.py:127` (configure)

2. **pyperclip**
   - Purpose: Cross-platform clipboard support
   - Usage: Auto-copy generated commands
   - Location: `how/main.py:8` (import), `main.py:259` (copy)

3. **psutil**
   - Purpose: System and process utilities
   - Usage: Detect current terminal/shell
   - Location: `how/main.py:13` (import), `main.py:93` (Process)

### Standard Library Usage
- `sys`: CLI argument parsing, exit codes
- `os`: File operations, environment variables, path handling
- `threading`: Spinner animation in separate thread
- `time`: Sleep, delays
- `getpass`: Get current username
- `platform`: OS and release detection
- `shutil`: Check installed tools (shutil.which)
- `itertools`: Infinite cycle for spinner frames
- `logging`: Warning-level logging
- `concurrent.futures`: ThreadPoolExecutor for API timeout handling
- `datetime`: Timestamp generation for history

---

## TypeScript Version (`how-ts/`)

### Package Information
- **Package Name**: `how-cli-ts`
- **Version**: 1.0.0
- **Minimum Node.js**: 18.0.0+
- **Build System**: TypeScript compiler (tsc)
- **Package Manager**: npm

### Runtime Dependencies (`package.json`)

#### 1. **@google/generative-ai** (^0.21.0)
   - Purpose: Google Gemini API SDK
   - Provider: `GeminiProvider`
   - File: `how-ts/src/providers/gemini.ts`

#### 2. **openai** (^4.70.0)
   - Purpose: OpenAI and Azure OpenAI API client
   - Providers: `OpenAIProvider`, `AzureOpenAIProvider`
   - Files: 
     - `how-ts/src/providers/openai.ts`
     - `how-ts/src/providers/azure-openai.ts`

#### 3. **@anthropic-ai/sdk** (^0.32.0)
   - Purpose: Anthropic Claude API client
   - Provider: `ClaudeProvider`
   - File: `how-ts/src/providers/claude.ts`

#### 4. **@google-cloud/vertexai** (^1.9.0)
   - Purpose: Google Cloud Vertex AI SDK
   - Provider: `VertexClaudeProvider`
   - File: `how-ts/src/providers/vertex-claude.ts`
   - Additional: Used for Claude models via Vertex AI

#### 5. **google-auth-library** (^9.0.0)
   - Purpose: Google Cloud authentication
   - Used by: Vertex AI provider for ADC authentication
   - File: `how-ts/src/providers/vertex-claude.ts`

#### 6. **clipboardy** (^4.0.0)
   - Purpose: Cross-platform clipboard operations
   - Usage: Auto-copy generated commands
   - File: `how-ts/src/utils/` (likely in display utilities)

### Development Dependencies

#### 1. **typescript** (^5.6.0)
   - Purpose: TypeScript compiler and type checking
   - Usage: Transpile TS to JS
   - Build command: `npm run build` → `tsc`

#### 2. **ts-node** (^10.9.2)
   - Purpose: TypeScript execution without compilation
   - Usage: Development mode
   - Dev command: `npm run dev` → `ts-node src/index.ts`

#### 3. **@types/node** (^22.0.0)
   - Purpose: TypeScript type definitions for Node.js
   - Usage: Type safety for Node.js APIs

### Node.js Built-in Modules
- `fs`: File system operations (config, history)
- `os`: Operating system utilities (homedir, platform)
- `path`: Path manipulation
- `child_process`: Execute shell commands (execSync for tool detection)
- `process`: Environment variables, process info

---

## Development Tools & Scripts

### Python
```bash
# Installation
pip install how-cli-assist

# Development (with uv)
uv add <dependency>
source .venv/bin/activate
```

### TypeScript
```bash
# Build
npm run build        # Compile TS → dist/

# Development
npm run dev -- <args>  # Run without compilation

# Clean
npm run clean        # Remove dist/

# Start
npm start            # Run compiled version
```

---

## Environment Variables

### Python Version
- `GOOGLE_API_KEY`: Gemini API key (fallback to file)
- `HOW_MODEL`: Override default model (default: `models/gemini-2.5-flash-lite`)

### TypeScript Version

#### Provider Selection
- `AI_PROVIDER`: Provider name (gemini|openai|azure|claude|vertex-claude)

#### Google Gemini
- `GOOGLE_API_KEY`: API key
- `GEMINI_MODEL` or `HOW_MODEL`: Model name

#### OpenAI
- `OPENAI_API_KEY`: API key
- `OPENAI_MODEL`: Model name
- `OPENAI_ORGANIZATION`: Organization ID (optional)

#### Azure OpenAI
- `AZURE_OPENAI_API_KEY`: API key
- `AZURE_OPENAI_ENDPOINT`: Service endpoint
- `AZURE_OPENAI_API_VERSION`: API version (default: 2024-02-15-preview)
- `AZURE_OPENAI_DEPLOYMENT`: Deployment name

#### Anthropic Claude
- `ANTHROPIC_API_KEY`: API key
- `CLAUDE_MODEL`: Model name

#### Vertex AI Claude
- `ANTHROPIC_VERTEX_PROJECT_ID` or `GOOGLE_CLOUD_PROJECT`: GCP project ID
- `CLOUD_ML_REGION` or `VERTEX_LOCATION`: Region (default: us-central1)
- `VERTEX_CLAUDE_MODEL`: Model name with @date format

---

## Version Compatibility

### Python
- **Python**: 3.8+ (specified in pyproject.toml)
- **OS**: Cross-platform (macOS, Linux, Windows)
- **Shell Detection**: Uses psutil for cross-platform compatibility

### TypeScript
- **Node.js**: 18.0.0+ (specified in package.json engines)
- **TypeScript**: 5.6.0
- **OS**: Cross-platform
- **Tool Detection**: Uses `which` (Unix) / `where` (Windows)

---

## API Versions

### Current Model Defaults

**Python**:
- Gemini: `models/gemini-2.5-flash-lite`

**TypeScript**:
- Gemini: `models/gemini-2.5-flash-lite`
- OpenAI: `gpt-4o-mini`
- Azure: (deployment-based)
- Claude: `claude-3-5-sonnet-20241022`
- Vertex Claude: `claude-3-5-sonnet@20241022`

### Short Name Mappings (TypeScript Only)
```typescript
// Claude provider
'sonnet-4-5' → 'claude-sonnet-4-5'
'haiku-4-5' → 'claude-haiku-4-5'
'opus-4-1' → 'claude-opus-4-1'

// Vertex Claude provider
'sonnet-4-5' → 'claude-sonnet-4-5@20250929'
'haiku-4-5' → 'claude-haiku-4-5@20251001'
'opus-4-1' → 'claude-opus-4-1@20250805'
```