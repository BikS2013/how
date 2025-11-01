# Code Style and Conventions: How-CLI

**Last Updated**: 2025-11-01

## Python Version Style (`how/`)

### General Conventions

#### Naming
- **Functions**: `snake_case` (e.g., `get_installed_tools`, `clean_response`)
- **Classes**: `PascalCase` (e.g., `ApiError`, `AuthError`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `CONFIG_DIR`, `MODEL_NAME`, `TIMEOUT`)
- **Variables**: `snake_case` (e.g., `api_key`, `current_dir`, `full_command`)

#### File Organization (`how/main.py`)
```python
# 1. Imports (grouped by standard lib → third-party)
import sys
import os
...
import google.generativeai as genai
...

# 2. Logging configuration
logging.basicConfig(level=logging.WARNING)

# 3. Constants
CONFIG_DIR = ...
API_KEY_FILE = ...

# 4. Exception classes
class ApiError(Exception): pass
class AuthError(ApiError): pass

# 5. Utility functions (small → large)
def header(): ...
def clean_response(): ...
def spinner(): ...

# 6. Main business logic
def generate_response(): ...
def main(): ...

# 7. Entry point
if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt: ...
```

### Docstrings
- **Not consistently used** in current codebase
- Functions are short and self-explanatory
- Type hints **not used** (Python 3.8+ compatible but not annotated)

### Error Handling

#### Exception Hierarchy
```python
class ApiError(Exception): pass           # Base
class AuthError(ApiError): pass          # Specific
class ContentError(ApiError): pass
class ApiTimeoutError(ApiError): pass
```

#### Pattern
```python
try:
    api_key = get_or_create_api_key()
except AuthError as e:
    print(f"❌ Authentication Error: {e}")
    sys.exit(1)
```

**Convention**: Catch specific exceptions, print user-friendly message, exit with code.

### Logging
```python
logger = logging.getLogger(__name__)
logger.warning(f"Failed to write history: {e}")
```

**Convention**: Use `logger.warning()` for non-fatal issues (history, clipboard failures).

### String Formatting
- **f-strings** preferred: `f"❌ Error: {e}"`
- **str.format()** not used
- **%** formatting not used

### Line Length
- Generally under 120 characters
- Some longer lines for readability (prompt construction)

### Import Aliasing
```python
import google.generativeai as genai
```

**Convention**: Common alias for long package names.

---

## TypeScript Version Style (`how-ts/`)

### TypeScript Configuration (`tsconfig.json`)

**Expected Settings** (based on project structure):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Naming Conventions

#### Types & Interfaces
- **Interfaces**: `PascalCase` with `I` prefix optional
  - `BaseProvider`, `ProviderOptions`, `ResolvedConfig`
- **Type Aliases**: `PascalCase`
  - `AIProvider = 'gemini' | 'openai' | ...`
- **Enums**: Not used (prefer union types)

#### Variables & Functions
- **Constants**: `UPPER_SNAKE_CASE`
  - `CONFIG_DIR`, `TIMEOUT`, `MAX_RETRIES`
- **Functions**: `camelCase`
  - `createProvider`, `resolveConfig`, `loadConfigFile`
- **Variables**: `camelCase`
  - `apiKey`, `currentDir`, `installedTools`
- **Files**: `kebab-case.ts`
  - `config-loader.ts`, `azure-openai.ts`, `os-prompt.ts`

### File Organization Pattern

#### Module Structure
```typescript
// 1. JSDoc comment (file purpose)
/**
 * Configuration file loader for How-CLI
 * Supports loading provider configuration from JSON file
 */

// 2. Imports (external → internal)
import * as fs from 'fs';
import { CONFIG_FILE, AIProvider } from './index';

// 3. Type definitions
export interface ProviderConfig { ... }
export interface ResolvedConfig { ... }

// 4. Functions (exported)
export function loadConfigFile(...): ... { }
export function saveConfigFile(...): ... { }
export function resolveConfig(...): ... { }

// 5. Helpers (private, not exported)
function expandClaudeModel(model: string): string { ... }
```

### Type Safety

#### Strict Mode
- **null checks**: All enabled
- **Type assertions**: Minimal use
- **Type guards**: Used for provider validation
  ```typescript
  function isValidProvider(provider: string): provider is AIProvider {
    return getSupportedProviders().includes(provider as AIProvider);
  }
  ```

#### Interface Usage
```typescript
// Provider contract
export interface BaseProvider {
  readonly name: string;
  generateResponse(prompt: string, silent: boolean, verbose?: boolean): Promise<string>;
  validateConfig(): void;
}
```

**Convention**: Use `readonly` for immutable properties.

### Error Handling

#### TypeScript Pattern
```typescript
try {
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content);
} catch (error) {
  console.warn(`Warning: Could not load config file: ${error instanceof Error ? error.message : error}`);
  return null;
}
```

**Convention**: Check `error instanceof Error` before accessing `.message`.

### Async/Await
```typescript
async generateResponse(prompt: string, silent: boolean): Promise<string> {
  const response = await this.client.messages.create({ ... });
  return response.content[0].text;
}
```

**Convention**: Use `async/await`, not `.then()` chains.

### String Formatting
- **Template literals** for all string interpolation: `` `${var}` ``
- **Single quotes** for simple strings: `'gemini'`
- **No string concatenation** with `+`

### Object/Array Destructuring
```typescript
const { provider, model } = config;
const [firstLine, ...rest] = text.split('\n');
```

**Convention**: Use when accessing multiple properties.

### Exports
- **Named exports** preferred: `export function createProvider(...)`
- **Default exports** not used
- **Index files** re-export: `export { GeminiProvider } from './gemini';`

### Comments

#### JSDoc (Interfaces & Public Functions)
```typescript
/**
 * Create a provider instance based on configuration
 * @param config Resolved configuration object
 * @returns Instantiated provider
 */
export function createProvider(config: ResolvedConfig): BaseProvider { ... }
```

#### Inline Comments
```typescript
// Load config file
const fileConfig = loadConfigFile(configFilePath);

// Determine provider (CLI > Env > File > Default)
const provider = cliProvider || PROVIDER_CONFIG.provider || ...;
```

**Convention**: Explain "why" for non-obvious logic; omit for self-explanatory code.

---

## Shared Conventions (Python & TypeScript)

### Configuration File Format
```json
{
  "provider": "openai",
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4o-mini"
  },
  "claude": {
    "apiKey": "sk-ant-...",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

**Convention**: JSON with 2-space indentation.

### History File Format
```
[YYYY-MM-DD HH:MM:SS] Q: <question>
Commands:
<command1>
<command2>

```

**Convention**: Timestamp in brackets, question on same line, commands indented.

### CLI Argument Parsing

**Python**:
```python
silent = "--silent" in sys.argv
type_effect = "--type" in sys.argv and not silent
```

**TypeScript** (likely similar manual parsing):
```typescript
const silent = process.argv.includes('--silent');
```

**Convention**: Manual parsing, not using argparse/commander (simple CLI).

### Exit Codes

**Python**:
- `0`: Success
- `1`: Error (auth, API, content)
- `130`: Keyboard interrupt (SIGINT)

**TypeScript**: Likely similar convention.

---

## Code Quality Standards

### Python

#### No Linting Configuration Found
- PEP 8 generally followed
- Line length flexible (up to ~120 chars)
- No `flake8`, `black`, `mypy` config files

#### Error Messages
```python
print(f"❌ Error: {e}")           # User-facing
logger.warning(f"...")             # Internal logging
```

**Convention**: Emoji prefix for user messages (❌, ⚠️, 👋).

### TypeScript

#### ESLint/Prettier (Assumed)
- No config files visible, likely using IDE defaults
- Consistent formatting (2-space indentation)
- Semicolons **not used** (modern TS style)

#### Type Coverage
- Full type annotations on functions
- Minimal `any` usage
- Interface-driven design

---

## Import Organization

### Python
```python
# Standard library (alphabetical within group)
import concurrent.futures
import datetime
import getpass
import itertools
import logging
import os
import platform
import psutil
import shutil
import sys
import threading
import time

# Third-party
import google.generativeai as genai
import pyperclip
```

**Convention**: Standard lib → Third-party, alphabetical within groups.

### TypeScript
```typescript
// Node.js built-ins
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Third-party
import { Anthropic } from '@anthropic-ai/sdk';

// Internal (relative imports)
import { BaseProvider } from './base';
import { CONFIG_FILE } from '../config';
```

**Convention**: Built-ins → Third-party → Internal, grouped logically.

---

## Testing Conventions

### Current State
- **No test files** in repository
- **No test framework** configured
- **Manual testing** expected

### Future Recommendations
- **Python**: Use `pytest`
- **TypeScript**: Use `jest` or `vitest`
- **Test Structure**: Mirror `src/` in `tests/` directory

---

## Documentation Style

### README Structure (Both Versions)
1. **Header**: Project name, logo, tagline
2. **Features**: Bulleted list with emojis
3. **Installation**: Step-by-step commands
4. **Quick Start**: Copy-paste examples
5. **Configuration**: Env vars, config file examples
6. **Examples**: Real-world usage
7. **Troubleshooting**: Common errors and solutions
8. **License & Author**

### Code Examples in README
```bash
# Comment describing example
command --flag value
> expected output
```

**Convention**: `#` for comments, `>` for output.

---

## Version Control Conventions

### Commit Messages (Inferred from Git Log)
```
prewarm option added
fixed by codex
typescript version, more models, verbose option
Add disclaimer about How-CLI's purpose and scope
```

**Style**: 
- Lowercase, no period
- Imperative mood ("add", not "added")
- Brief (one line)
- No conventional commit format

### Branch Strategy
- **Main branch**: `main`
- No visible feature branches (likely direct commits or squashed PRs)

---

## Summary of Key Differences

| Aspect | Python | TypeScript |
|--------|--------|------------|
| **Naming** | `snake_case` | `camelCase` |
| **Constants** | `UPPER_SNAKE_CASE` | `UPPER_SNAKE_CASE` |
| **Files** | `main.py` | `kebab-case.ts` |
| **Strings** | f-strings | Template literals |
| **Type Safety** | No annotations | Full TypeScript |
| **Exports** | N/A | Named exports |
| **Async** | Threading | async/await |
| **Comments** | Sparse | JSDoc for public APIs |