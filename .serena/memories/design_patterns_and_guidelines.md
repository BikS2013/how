# Design Patterns and Guidelines: How-CLI

**Last Updated**: 2025-11-01

## Core Design Principles

### 1. Context-Aware Command Generation

**Principle**: Every AI request includes rich system context to generate accurate, environment-specific commands.

**Implementation**:
```
CONTEXT includes:
- Operating System & version
- Shell type (bash, zsh, etc.)
- Current working directory
- Current user
- Git repository status
- Top 20 files in CWD
- Installed development tools
```

**Location**:
- Python: `how/main.py:215-226` (prompt construction)
- TypeScript: `how-ts/src/index.ts` (CONTEXT constant)

**Rationale**: Commands must be executable in the user's actual environment, not generic suggestions.

---

### 2. Minimal Output Philosophy

**Principle**: Output ONLY the command, no conversational text.

**Rules** (from prompt):
```
1. Generate *only* the exact, executable shell command(s)
2. Context is Key: Use CONTEXT to write specific commands
3. No Banter: No greetings, sign-offs, or filler
4. Safety: Add single-line comment for destructive commands
5. Questions: Concise one-line answers for non-command queries
6. Ambiguity: Ask single clarifying question starting with #
```

**Location**:
- Python: `how/main.py:227-234`
- TypeScript: Similar prompt structure

**Rationale**: Users want commands, not explanations. Copy-paste ready output.

---

### 3. Configuration Hierarchy (TypeScript)

**Pattern**: Layered configuration with clear precedence.

**Priority** (Highest → Lowest):
```
1. CLI Arguments (--provider, --model, --region)
2. Environment Variables
3. Config File (~/.how-cli/config.json)
4. Built-in Defaults
```

**Implementation**: `config-loader.ts:110-187`

**Benefits**:
- Flexibility: Override at any level
- Reproducibility: Config file for team sharing
- Security: Env vars for sensitive data
- Convenience: CLI flags for quick switches

---

### 4. Provider Abstraction (TypeScript)

**Pattern**: Strategy Pattern for AI providers

**Interface** (`providers/base.ts`):
```typescript
interface BaseProvider {
  readonly name: string;
  generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>;
  validateConfig(): void;
}
```

**Factory** (`providers/factory.ts:17-58`):
```typescript
createProvider(config: ResolvedConfig): BaseProvider
```

**Benefits**:
- **Extensibility**: Add new providers without modifying core logic
- **Type Safety**: Enforced interface contract
- **Testability**: Mock providers for testing
- **Separation**: Provider-specific logic isolated

**Adding a New Provider**:
1. Implement `BaseProvider` interface
2. Add to `createProvider()` switch case
3. Add config in `config/index.ts`
4. Update `config-loader.ts` resolution

---

### 5. Error Handling Strategy

#### Python (`how/main.py:25-28`)

**Error Hierarchy**:
```
ApiError (base)
  ├─ AuthError: API key issues
  ├─ ContentError: Blocked/empty responses
  └─ ApiTimeoutError: Request timeouts
```

**Retry Logic** (`main.py:137-160`):
- Max 3 retries
- Exponential backoff: 2^attempt seconds
- Rate limit handling (429 errors): Additional +1 second
- Timeout: 30s API + 5s buffer

**User-Facing Messages**:
```python
except AuthError as e: print(f"❌ Authentication Error: {e}")
except ContentError as e: print(f"❌ Error: {e}")
```

#### TypeScript

**Error Types**:
- Configuration errors (missing API keys)
- Provider-specific errors
- Network/timeout errors
- Content filtering errors

**Validation**:
- `validateConfig()` called before API calls
- Type safety prevents many runtime errors

---

### 6. History Management

**Pattern**: Append-only log with timestamps

**Format** (`how/main.py:61-71`):
```
[YYYY-MM-DD HH:MM:SS] Q: <question>
Commands:
<command1>
<command2>

```

**Location**: `~/.how-cli/history.log`

**Benefits**:
- Audit trail of all commands
- Easy to grep/search
- Timestamp for chronological analysis
- Human-readable format

---

### 7. Response Cleaning

**Pattern**: Strip markdown formatting

**Logic** (`how/main.py:39-46`):
```python
def clean_response(text: str) -> str:
    # Remove triple backticks with optional language
    if text.startswith("```") and text.endswith("```"):
        # Strip first line (language identifier) and closing ```
    # Remove single backticks
    elif text.startswith("`") and text.endswith("`"):
        text = text[1:-1]
```

**Rationale**: AI models often return commands in code blocks; users need raw commands.

---

### 8. User Experience Enhancements

#### Clipboard Auto-Copy

**Implementation**:
- Python: `pyperclip.copy(full_command)` (line 259)
- TypeScript: `clipboardy` library

**Rationale**: Immediate paste after command generation.

#### Visual Feedback

**Spinner Animation** (Python `main.py:49-58`):
- Animated frames: `["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]`
- 100ms per frame
- Stops on API completion
- Suppressed with `--silent`

**Typewriter Effect**:
- Optional with `--type`
- 10ms per character delay
- Disabled if `--silent` is set

**Rationale**: Provides feedback during API calls; typewriter adds polish.

---

### 9. Model Name Aliasing (TypeScript)

**Pattern**: User-friendly short names → Full model IDs

**Mapping** (`config-loader.ts:157-180`):
```typescript
// Claude
'sonnet-4-5' → 'claude-sonnet-4-5'
'haiku-4-5' → 'claude-haiku-4-5'

// Vertex Claude (with date versions)
'sonnet-4-5' → 'claude-sonnet-4-5@20250929'
'haiku-4-5' → 'claude-haiku-4-5@20251001'
```

**Expansion Timing**: During config resolution, before provider creation

**Benefits**:
- **UX**: Shorter, memorable names
- **Consistency**: Same short name across providers where possible
- **Versioning**: Explicit dates for Vertex AI reproducibility

---

### 10. Security Practices

#### API Key Storage

**Python** (`main.py:117-120`):
```python
os.chmod(API_KEY_FILE, 0o600)  # Owner read/write only
```

**File Location**: `~/.how-cli/.google_api_key` (hidden directory)

**Environment Priority**: Check `GOOGLE_API_KEY` before file

#### Non-Interactive Sessions

**Python** (`main.py:111-112`):
```python
if not sys.stdin.isatty():
    raise AuthError("GOOGLE_API_KEY not found in non-interactive session.")
```

**Rationale**: Prevent hanging in CI/CD; require env var in automated contexts.

---

### 11. Cross-Platform Compatibility

#### Tool Detection

**Python** (`main.py:86`):
```python
shutil.which(tool)  # Cross-platform tool checker
```

**TypeScript** (`utils/system.ts:20-21`):
```typescript
const command = os.platform() === 'win32' ? 'where' : 'which';
execSync(`${command} ${tool}`)
```

#### Terminal Detection

**Python**: Uses `psutil.Process(os.getppid()).name()`  
**TypeScript**: Checks `TERM_PROGRAM`, `SHELL`, then `ps` command (Unix only)

---

### 12. Separation of Concerns (TypeScript)

**Module Breakdown**:
```
config/       → Configuration management
providers/    → AI provider implementations
utils/        → Reusable utilities (display, history, system, text)
errors/       → Error definitions
index.ts      → CLI orchestration
os-prompt.ts  → Standalone context generator
```

**Benefits**:
- **Maintainability**: Easy to find and modify code
- **Testability**: Each module can be unit tested
- **Reusability**: Utils can be imported elsewhere

---

### 13. OS Prompt Utility Design (TypeScript)

**Purpose**: Generate context prompt without calling AI

**Use Cases**:
- Pipe to other AI tools (Claude, ChatGPT)
- Build datasets for fine-tuning
- Debug prompt construction
- Integration with custom agents

**Output Formats**:
- `text`: Raw prompt string
- `json`: Structured JSON payload
- `jsonl`: Single-line JSON for streaming/appending

**Features**:
- `--out <file>`: Write to file
- `--append`: Append instead of overwrite
- `--no-newline`: No trailing newline (for streaming)
- `--cwd <path>`: Override context directory
- `--shell <name>`: Override shell name

**Location**: `how-ts/src/os-prompt.ts`

---

## Anti-Patterns to Avoid

### ❌ Don't Add Conversational Output
- No "Here is the command:"
- No "Hope this helps!"
- Output ONLY commands

### ❌ Don't Ignore Context
- Always check OS, shell, CWD before generating
- Use installed tools (don't suggest unavailable tools)

### ❌ Don't Hardcode Configuration
- Use environment variables and config files
- Allow overrides at multiple levels

### ❌ Don't Skip Validation
- Validate API keys before API calls
- Check provider configuration completeness

### ❌ Don't Block on Errors
- Handle timeouts gracefully
- Retry on transient errors
- Provide actionable error messages

---

## Future Extension Guidelines

### Adding a New Provider (TypeScript)

1. **Create Provider Class**:
   ```typescript
   // src/providers/new-provider.ts
   export class NewProvider implements BaseProvider {
     readonly name = 'New Provider';
     
     validateConfig() { /* check API key */ }
     
     async generateResponse(prompt: string, silent: boolean): Promise<string> {
       // Call API, handle errors, return text
     }
   }
   ```

2. **Update Factory**:
   ```typescript
   // src/providers/factory.ts
   case 'new-provider':
     return new NewProvider(config.newProvider.apiKey);
   ```

3. **Add Configuration**:
   ```typescript
   // src/config/index.ts
   export type AIProvider = 'gemini' | 'openai' | ... | 'new-provider';
   
   newProvider: {
     apiKey: process.env.NEW_PROVIDER_API_KEY || '',
     model: process.env.NEW_PROVIDER_MODEL || 'default-model',
   }
   ```

4. **Update Config Loader**:
   ```typescript
   // src/config/config-loader.ts
   newProvider: {
     apiKey: ...,
     model: cliModel || PROVIDER_CONFIG.newProvider.model || ...,
   }
   ```

5. **Update Documentation**: README.md provider table

---

### Adding a New Feature

**Process**:
1. Identify where it belongs (config, provider, util, or core)
2. Update relevant interfaces (TypeScript)
3. Implement in Python and TypeScript for consistency
4. Add CLI flag if needed
5. Update README with usage examples
6. Test cross-platform

**Example**: Adding `--max-tokens` flag
- Config: Add to `ProviderOptions` interface
- Providers: Pass to API calls
- CLI: Parse flag in `index.ts`
- Docs: Update README options table