# How-CLI Code Style and Conventions

## General Python Style
- **Python Version:** Requires Python 3.8+
- **File Encoding:** UTF-8
- **Line Style:** Generally concise, functional approach

## Naming Conventions

### Constants
- **Style:** UPPER_CASE_WITH_UNDERSCORES
- **Examples:** 
  - `CONFIG_DIR`
  - `API_KEY_FILE`
  - `HISTORY_FILE`
  - `MODEL_NAME`

### Functions
- **Style:** snake_case
- **Examples:**
  - `clean_response()`
  - `get_installed_tools()`
  - `get_current_terminal()`
  - `log_history()`

### Classes
- **Style:** PascalCase
- **Examples:**
  - `ApiError`
  - `AuthError`
  - `ContentError`
  - `ApiTimeoutError`

### Variables
- **Style:** snake_case
- **Examples:**
  - `stop_event`
  - `spinner_thread`
  - `current_dir`

## Type Hints
- **Usage:** Selective - used primarily on function signatures
- **Examples:**
  ```python
  def generate_response(api_key: str, prompt: str, silent: bool=False, max_retries: int=3) -> str:
  def get_or_create_api_key(force_reenter: bool) -> str:
  ```
- **Style:** Standard Python typing annotations

## Docstrings
- **Current State:** No docstrings in the codebase
- **Philosophy:** Code is simple and self-explanatory; names are descriptive enough

## Code Organization

### Imports
Located at the top of `how/main.py`, standard library first:
- Standard library imports
- Third-party imports (google.generativeai, pyperclip, psutil)

### Structure Order in main.py
1. Imports
2. Logger setup
3. Constants
4. Custom exception classes
5. Utility functions (header, clean_response, spinner, etc.)
6. Core business logic (get_or_create_api_key, generate_response)
7. Main entry point (main function)

## Error Handling
- **Exception Hierarchy:** Custom exceptions inherit directly from `Exception`
- **Pattern:** Simple one-line class definitions with `pass`
  ```python
  class ApiError(Exception): pass
  ```
- **Usage:** Specific exceptions raised for specific error conditions
- **User Feedback:** Clear error messages with emoji indicators (❌, ⚠️)

## String Formatting
- **Primary Style:** f-strings
- **Example:** `f"Error: {e}"`
- **Multi-line prompts:** Triple-quoted f-strings with proper indentation

## File I/O
- **Encoding:** Explicit UTF-8 encoding
  ```python
  with open(API_KEY_FILE, "w", encoding="utf-8") as f:
  ```
- **Security:** Sensitive files (API key) use restricted permissions (0o600)

## Code Density
- **Style:** Compact, efficient code
- **Example:** Multiple operations on single lines when clear
  ```python
  if \\\"--history\\\" in sys.argv: show_history(); sys.exit(0)
  ```

## Comments
- **Usage:** Minimal, used only for clarification
- **Example:** `# ✅ ensure spinner stops`
- **Philosophy:** Code should be self-documenting through clear naming

## Logging
- **Library:** Standard Python `logging` module
- **Usage:** Warnings for non-fatal issues (e.g., clipboard failures)
- **Level:** Warning level for operational issues
  ```python
  logger.warning(f"Clipboard copy failed: {e}")
  ```

## Dependencies Management
- **Tool:** setuptools (standard Python packaging)
- **Configuration:** `pyproject.toml` with explicit dependency list
- **Minimal Dependencies:** Only essential libraries included
