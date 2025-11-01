# TypeScript Implementation of How-CLI

## Overview

A complete TypeScript/Node.js port of the How-CLI Python application has been created in the `how-ts/` directory. This implementation maintains full feature parity with the Python version while leveraging TypeScript's type safety and modern JavaScript ecosystem.

## Project Location

**Path:** `/Users/giorgosmarinos/aiwork/coding-platform/how/how-ts/`

## Implementation Date

November 1, 2025

## Project Structure

```
how-ts/
├── src/
│   ├── config/
│   │   └── index.ts          # Configuration constants (CONFIG_DIR, API_KEY_FILE, etc.)
│   ├── errors/
│   │   └── index.ts          # Custom error classes (ApiError, AuthError, etc.)
│   ├── services/
│   │   ├── api-key.ts        # API key management functions
│   │   └── gemini.ts         # Google Gemini API integration
│   ├── utils/
│   │   ├── display.ts        # Display utilities (header, spinner, typewriter)
│   │   ├── history.ts        # History logging and retrieval
│   │   ├── system.ts         # System introspection (tools, terminal, files)
│   │   └── text.ts           # Text processing (cleanResponse)
│   └── index.ts              # Main CLI entry point
├── dist/                     # Compiled JavaScript output
│   └── index.js             # Main executable (chmod +x)
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Tech Stack

### Core Dependencies
- **@google/generative-ai** (^0.21.0) - Google Gemini API client
- **clipboardy** (^4.0.0) - Cross-platform clipboard support

### Development Dependencies
- **typescript** (^5.6.0) - TypeScript compiler
- **ts-node** (^10.9.2) - TypeScript executor for development
- **@types/node** (^22.0.0) - Node.js type definitions

### Runtime Requirements
- **Node.js** >= 18.0.0

## Key Files and Their Purposes

### Configuration (`src/config/index.ts`)
Defines all configuration constants:
- `CONFIG_DIR`: `~/.how-cli`
- `API_KEY_FILE`: `~/.how-cli/.google_api_key`
- `HISTORY_FILE`: `~/.how-cli/history.log`
- `MODEL_NAME`: From `HOW_MODEL` env var or default `models/gemini-2.5-flash-lite`
- `TIMEOUT`: 30000ms (30 seconds)
- `MAX_RETRIES`: 3

### Error Classes (`src/errors/index.ts`)
Custom error hierarchy:
- `ApiError` - Base error class for API-related errors
- `AuthError extends ApiError` - Authentication failures
- `ContentError extends ApiError` - Content generation/blocking issues
- `ApiTimeoutError extends ApiError` - API timeout errors

All errors use `Object.setPrototypeOf()` to maintain proper prototype chain in TypeScript.

### Services

#### API Key Service (`src/services/api-key.ts`)
**Functions:**
- `getOrCreateApiKey(forceReenter: boolean): Promise<string>` - Retrieves or prompts for API key
- `saveApiKey(apiKey: string): void` - Saves API key to file with 0o600 permissions

**Logic:**
1. Check `GOOGLE_API_KEY` environment variable
2. Read from `~/.how-cli/.google_api_key` file
3. Prompt user interactively using `readline`
4. Save with secure permissions

#### Gemini API Service (`src/services/gemini.ts`)
**Functions:**
- `generateResponse(apiKey: string, prompt: string, silent: boolean): Promise<string>`

**Features:**
- Retry logic with exponential backoff (max 3 retries)
- 30-second timeout using `Promise.race`
- Handles rate limiting (429 errors)
- Handles content blocking
- Spinner animation during API call (unless silent)

### Utilities

#### Display Utilities (`src/utils/display.ts`)
- `header()` - Displays ASCII art banner
- `spinner(message: string)` - Returns start/stop functions for animated spinner
- `typewriterEffect(text: string, delay: number)` - Async typewriter animation

**Implementation Notes:**
- Spinner uses `setInterval` instead of threading
- Typewriter uses async/await with `setTimeout`

#### Text Utilities (`src/utils/text.ts`)
- `cleanResponse(text: string): string` - Removes markdown code blocks from API response

**Logic:**
- Removes triple backticks (```)
- Removes language identifiers
- Removes single backticks (`)
- Trims whitespace

#### System Utilities (`src/utils/system.ts`)
- `getInstalledTools(): string` - Detects installed CLI tools
- `getCurrentTerminal(): string` - Identifies current shell/terminal
- `getFilesList(directory: string, maxFiles: number): string` - Lists files in directory
- `isGitRepository(directory: string): boolean` - Checks for .git directory

**Implementation:**
- Uses `execSync` with `which` (Unix) or `where` (Windows)
- Reads `TERM_PROGRAM` and `SHELL` env vars
- Falls back to `ps` command for parent process name

#### History Utilities (`src/utils/history.ts`)
- `logHistory(question: string, commands: string[]): void` - Appends to history file
- `showHistory(): void` - Displays history file contents

**Format:**
```
[YYYY-MM-DD HH:MM:SS] Q: <question>
Commands:
<command1>
<command2>

```

### Main Entry Point (`src/index.ts`)

**Features:**
- Shebang: `#!/usr/bin/env node`
- Async main function
- Command-line argument parsing
- System context gathering
- Prompt construction
- API call orchestration
- Output display (normal or typewriter)
- Clipboard copy
- History logging
- Comprehensive error handling

**Error Handling:**
- Graceful SIGINT (Ctrl+C) handling
- Missing dependency detection
- Typed error catching
- Debug mode support via `DEBUG` env var

## Build Process

### Commands
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run clean        # Remove dist/ directory
npm run dev          # Run with ts-node (development)
npm run start        # Run compiled version
```

### TypeScript Configuration (`tsconfig.json`)
- **target**: ES2020
- **module**: CommonJS
- **strict**: true
- **outDir**: ./dist
- **rootDir**: ./src
- **sourceMap**: true
- **declaration**: true

### Build Output
- Compiled JavaScript in `dist/` directory
- Source maps (.js.map)
- Type declarations (.d.ts)
- Declaration maps (.d.ts.map)

## Usage

```bash
# Help
node dist/index.js --help

# Ask question
node dist/index.js how to list all files

# History
node dist/index.js --history

# Set API key
node dist/index.js --api-key YOUR_KEY

# Silent mode
node dist/index.js --silent how to check disk space

# Typewriter effect
node dist/index.js --type how to create a git repo
```

## Testing Results

✅ **Compilation:** Successful with no TypeScript errors
✅ **Help Command:** Displays correct usage and options
✅ **History Command:** Shows "No history found" (expected for fresh install)
✅ **File Permissions:** dist/index.js set to executable (chmod +x)
✅ **Module Resolution:** All imports resolve correctly
✅ **Type Safety:** Full type checking throughout codebase

## Comparison with Python Version

### Maintained Features (100% Parity)
- ✅ All command-line flags (--help, --history, --api-key, --silent, --type)
- ✅ API key management (env var, file, interactive prompt)
- ✅ System context gathering (OS, shell, files, git, tools)
- ✅ Gemini API integration with retry logic
- ✅ History logging (same format)
- ✅ Clipboard support
- ✅ Spinner animation
- ✅ Typewriter effect
- ✅ Error handling (custom exceptions)
- ✅ Same prompt structure
- ✅ Secure file permissions (0o600)

### Improvements
- ✅ **Type Safety:** Full TypeScript type checking
- ✅ **Module Organization:** Clean separation of concerns
- ✅ **Async/Await:** Modern async patterns
- ✅ **Better Error Types:** Strongly typed error classes
- ✅ **Documentation:** Comprehensive JSDoc comments

### Technical Differences
- **Threading → Intervals:** `setInterval` instead of `threading.Thread`
- **psutil → execSync:** Uses `which`/`ps` commands instead of psutil library
- **pyperclip → clipboardy:** Different clipboard library
- **input() → readline:** Node.js readline for user input
- **Synchronous I/O:** Some file operations use sync methods for simplicity
  (can be converted to async if needed)

## Known Limitations

1. **No Global Install (yet):** Not published to npm, requires manual build
2. **Clipboard Dependency:** Requires native clipboard support (may fail in some environments)
3. **Process Introspection:** Terminal detection less robust than Python's psutil

## Future Enhancements

Potential improvements:
- Publish to npm registry
- Add ESLint/Prettier configuration
- Add Jest for unit testing
- Add CI/CD pipeline
- Support ESM modules (currently CommonJS)
- Add interactive mode with prompts
- Add shell completion scripts

## Memory File Updates

This memory file documents the TypeScript implementation. Other memory files remain accurate for the Python implementation. The two versions coexist independently in the same repository.
