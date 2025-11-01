# Design Patterns and Guidelines

## Architectural Patterns

### Single Module Design
- **Pattern:** All functionality in a single `main.py` module
- **Rationale:** Simple, small project doesn't need complex module structure
- **Trade-off:** Easy to understand and maintain for a focused CLI tool

### Functional Programming Style
- **Pattern:** Functions as primary code organization unit
- **Characteristics:**
  - No classes except for custom exceptions
  - Functions are relatively independent and focused
  - State managed through function parameters and return values

### Exception-Based Error Handling
- **Pattern:** Custom exception hierarchy for different error types
- **Implementation:**
  ```python
  class ApiError(Exception): pass
  class AuthError(Exception): pass
  class ContentError(Exception): pass
  class ApiTimeoutError(Exception): pass
  ```
- **Usage:** Specific exceptions for specific error conditions, caught and handled appropriately in main()

## Design Principles

### Separation of Concerns
Functions have clear, single responsibilities:
- `header()` - Display only
- `clean_response()` - Text processing only
- `generate_response()` - API interaction only
- `main()` - Orchestration and user interaction
- `log_history()` - Persistence only

### Context-Aware Design
The application gathers comprehensive system context:
- Operating system and version
- Current shell type
- Working directory
- Available files
- Git repository status
- Installed CLI tools

This context is embedded in prompts to generate highly specific commands.

### Resilience Patterns

#### Retry with Exponential Backoff
```python
for attempt in range(max_retries):
    try:
        # API call
    except RateLimitError:
        time.sleep((2**attempt)+1)
```

#### Timeout Protection
```python
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(model.generate_content, prompt, request_options={"timeout": TIMEOUT})
    response = future.result(timeout=TIMEOUT+5)
```

#### Graceful Degradation
Non-critical features fail silently with logging:
```python
try:
    pyperclip.copy(full_command)
except pyperclip.PyperclipException as e:
    logger.warning(f"Clipboard copy failed: {e}")
    # Application continues
```

### User Experience Patterns

#### Progressive Enhancement
- Basic functionality works always
- Optional enhancements: `--type` for typewriter effect, `--silent` for no animations
- Features degrade gracefully if unavailable

#### Feedback Mechanisms
- Spinner during long operations
- Clear error messages with emoji indicators
- Optional typewriter effect for engaging output
- Clipboard auto-copy for convenience

### Configuration Management

#### Lazy Initialization
API key is only requested when needed:
```python
api_key = get_or_create_api_key(force_reenter=False)
```

#### Secure Storage
- API key stored in `~/.how/api_key`
- File permissions set to 0o600 (owner read/write only)
- Directory created with `exist_ok=True` for idempotency

### Prompt Engineering Pattern
The prompt sent to Gemini follows a structured format:
1. **SYSTEM:** Role definition and objectives
2. **CONTEXT:** Environment details (OS, shell, CWD, files, tools)
3. **RULES:** Behavior guidelines and constraints
4. **REQUEST:** User's actual question
5. **RESPONSE:** Placeholder for AI response

This structure ensures consistent, high-quality command generation.

## Anti-Patterns to Avoid

### ❌ Over-Engineering
- Don't add complex abstractions for this simple tool
- Don't create unnecessary class hierarchies
- Don't split into multiple modules unless there's clear benefit

### ❌ Silent Failures
- Don't ignore critical errors (API failures, auth issues)
- Do log non-critical failures (clipboard)
- Always inform user of critical problems

### ❌ Insecure Storage
- Never store API keys in plaintext without proper permissions
- Always use 0o600 for sensitive files
- Don't commit API keys to version control

### ❌ Blocking Operations Without Feedback
- Always show spinner or progress indicator for long operations
- Implement timeouts for network calls
- Allow user to skip animations with `--silent`

## Code Organization Guidelines

### Import Organization
1. Standard library imports (grouped logically)
2. Third-party imports
3. Local imports (if any)

### Function Order in Files
1. Utility functions (header, clean_response, spinner)
2. Data persistence (log_history, show_history)
3. System introspection (get_installed_tools, get_current_terminal)
4. Core business logic (get_or_create_api_key, generate_response)
5. Main entry point (main)

### Constants Placement
All constants at the top of the file, after imports and logger setup.

## Thread Safety
- Spinner runs in daemon thread
- Thread synchronization via `threading.Event`
- Proper thread cleanup with `join()` to ensure threads stop

## API Integration Best Practices
- Use explicit timeouts
- Implement retry logic
- Handle specific API exceptions
- Parse and validate responses
- Provide meaningful error messages to users

## Testing Philosophy (Current State)
- **Manual testing only:** No automated tests
- **Focus on:** Real-world usage scenarios
- **Verification:** Command-line flags, error conditions, API interactions
- **Future:** Consider adding pytest for automated testing as project grows
