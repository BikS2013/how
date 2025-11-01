# How-CLI Project Overview

## Purpose
How-CLI is a terminal-based assistant that generates precise shell commands for any task. It's powered by Google Gemini's generative AI and provides context-aware, executable shell commands tailored to the user's current environment.

## Key Features
- Generates exact shell commands based on current working directory, OS, and available tools
- Context-aware: considers files, git repositories, shell type, and installed tools
- Command history logging for easy reference
- Clipboard support: copies generated commands automatically
- Optional typewriter effect for visually appealing output
- Configurable Google Gemini API key
- Graceful error handling (API errors, content blocks, timeouts)

## Project Philosophy
This is intentionally a simple, fun weekend hack project - a Gemini API wrapper designed to make typing "how to do X in bash" more convenient and amusing. It's not meant to be a sophisticated LLM-based shell integration but rather a practical utility.

## Tech Stack
- **Language:** Python 3.8+
- **Build System:** setuptools
- **Key Dependencies:**
  - `google-generativeai` - Google Gemini API client
  - `pyperclip` - Clipboard functionality
  - `psutil` - System and process utilities
- **Packaging:** Distributed via PyPI as `how-cli-assist`

## Project Structure
```
how/
├── how/
│   ├── __init__.py          (empty module initialization)
│   └── main.py              (main application logic)
├── pyproject.toml           (project configuration and dependencies)
├── setup.cfg                (metadata configuration)
├── README.md                (documentation)
├── LICENSE                  (MIT license)
├── .gitignore               (git ignore rules)
├── screenshot.png           (project screenshot)
└── record.mp4               (demo video)
```

## Entry Point
- **Console Script:** `how` command maps to `how.main:main`
- **Installation:** `pip install how-cli-assist`
- **Usage:** `how <question> [options]`

## Version
Current version: 1.0.1

## License
MIT License
