# Dependencies and Tech Stack

## Python Version
- **Minimum Required:** Python 3.8+
- **Recommendation:** Use virtual environment managed by UV tool

## Core Dependencies

### google-generativeai
- **Purpose:** Google Gemini API client library
- **Usage:** Core functionality for generating shell commands via AI
- **Key Classes/Functions:**
  - `genai.configure(api_key=...)`
  - `genai.GenerativeModel(model_name)`
  - `model.generate_content(prompt, request_options={...})`
- **Error Types:**
  - `genai.types.BlockedPromptException`
  - `genai.types.StopCandidateException`

### pyperclip
- **Purpose:** Cross-platform clipboard functionality
- **Usage:** Automatically copies generated commands to clipboard
- **Key Functions:**
  - `pyperclip.copy(text)`
- **Error Types:**
  - `pyperclip.PyperclipException` (handled gracefully with logging)

### psutil
- **Purpose:** System and process utilities
- **Usage:** Detecting installed tools and system information
- **Use Cases:**
  - Process enumeration
  - System information gathering

## Standard Library Dependencies
The project makes extensive use of Python standard library:

### File & OS Operations
- `os` - File system operations, environment variables
- `pathlib` - Path manipulations
- `getpass` - User information

### System & Platform
- `platform` - OS and system information
- `sys` - System-specific parameters and functions

### Concurrency
- `threading` - Spinner animation thread
- `concurrent.futures` - ThreadPoolExecutor for API timeout handling

### Data & Time
- `time` - Delays, sleep, and timing
- `json` - Potential JSON handling (if needed)

### Logging
- `logging` - Application logging

### Others
- `re` - Regular expressions (if used for text cleaning)

## Build System
- **Tool:** setuptools
- **Backend:** setuptools.build_meta
- **Configuration:** pyproject.toml (PEP 517/518 compliant)

## Development Tools
**Note:** Currently not configured in the project, but recommended:
- `black` - Code formatting
- `flake8` or `ruff` - Linting
- `mypy` - Static type checking
- `pytest` - Testing framework
- `build` - Building distributions
- `twine` - PyPI uploads

## Installation Methods

### For Users (Production)
```bash
pip install how-cli-assist
```

### For Developers (with UV, per user requirements)
```bash
source .venv/bin/activate
uv add google-generativeai
uv add pyperclip
uv add psutil
```

### For Developers (Traditional)
```bash
pip install -e .
```

## API Requirements
- **Google Gemini API Key:** Required for operation
- **Storage Location:** `~/.how/api_key`
- **Permissions:** File must be chmod 600 for security
- **Model:** Uses model specified in `MODEL_NAME` constant

## Platform Compatibility
- **Primary Target:** macOS (Darwin)
- **Likely Compatible:** Linux, Windows (with appropriate shell detection)
- **Shell Support:**
  - bash
  - zsh
  - fish
  - Other shells detected via environment variables

## Network Requirements
- **Internet Connection:** Required for Google Gemini API calls
- **Timeout:** 30 seconds per API request
- **Retry Logic:** Up to 3 retries with exponential backoff
- **Rate Limiting:** Handled with backoff strategy
