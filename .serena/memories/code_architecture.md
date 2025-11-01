# How-CLI Code Architecture

## Main Module: how/main.py

### Constants
- `CONFIG_DIR` - Configuration directory path
- `API_KEY_FILE` - API key storage file path
- `HISTORY_FILE` - Command history storage file path
- `MODEL_NAME` - Google Gemini model name

### Custom Exception Classes
All inherit from base `Exception`:
- `ApiError` - General API errors
- `AuthError` - Authentication failures
- `ContentError` - Content generation/blocking issues
- `ApiTimeoutError` - API timeout errors

### Core Functions

#### `header()`
Displays the CLI header/banner.

#### `clean_response(text: str) -> str`
Cleans and formats API responses by removing markdown code blocks and extra whitespace.

#### `spinner(stop_event: threading.Event)`
Displays an animated spinner during API calls.

#### `log_history(question: str, commands: list)`
Logs user questions and generated commands to history file.

#### `show_history()`
Displays the command history from the history file.

#### `get_installed_tools() -> str`
Detects and returns a list of common CLI tools installed on the system.

#### `get_current_terminal() -> str`
Determines the current shell/terminal type (bash, zsh, etc.).

#### `get_or_create_api_key(force_reenter: bool) -> str`
Retrieves or prompts for Google Gemini API key. Stores it securely with 0o600 permissions.

#### `generate_response(api_key: str, prompt: str, silent: bool, max_retries: int) -> str`
**Location:** `how/main.py:125-163`

Makes API calls to Google Gemini with:
- Retry logic (default 3 retries)
- 30-second timeout
- Spinner animation (unless silent)
- Exponential backoff for rate limiting
- Comprehensive error handling

#### `main()`
**Location:** `how/main.py:166-262`

Main entry point that:
1. Parses command-line arguments
2. Handles special flags (--help, --history, --api-key)
3. Gathers system context (OS, shell, CWD, files, git status, tools)
4. Constructs detailed prompt for Gemini
5. Generates commands via API
6. Displays results with optional typewriter effect
7. Copies commands to clipboard
8. Logs to history

## Context Collection
The application gathers rich context including:
- Operating system and version
- Current shell type
- Current working directory
- Current user
- Git repository status
- Files in current directory (top 20)
- Available CLI tools

This context is embedded in the prompt to generate highly specific, executable commands.

## Error Handling Strategy
- Custom exceptions for different error types
- Retry logic with exponential backoff for transient failures
- Graceful degradation (e.g., clipboard copy failures only logged, not fatal)
- Clear error messages to users with emoji indicators (❌, ⚠️)

## Threading
Uses threading for:
- Non-blocking spinner animation during API calls
- Timeout enforcement on API requests via `concurrent.futures.ThreadPoolExecutor`
