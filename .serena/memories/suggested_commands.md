# How-CLI Suggested Commands

## Development Commands

### Installation & Setup
```bash
# Install the package locally in development mode
pip install -e .

# Install from PyPI (for users)
pip install how-cli-assist

# Install with UV (following user's preference for Python package management)
source .venv/bin/activate
uv add how-cli-assist
```

### Running the Application
```bash
# Basic usage
how <your question>

# Example: Create a Python virtual environment
how to create a Python virtual environment

# Example: List files modified in last 7 days
how to list all files modified in the last 7 days

# Show command history
how --history

# Set or update Gemini API key
how --api-key YOUR_GEMINI_API_KEY_HERE

# Silent mode (no spinner/animations)
how --silent <question>

# Typewriter effect
how --type <question>

# Show help
how --help
```

### Building & Distribution
```bash
# Build distribution packages
python -m build

# Upload to PyPI (requires credentials)
python -m twine upload dist/*

# Clean build artifacts
rm -rf build/ dist/ *.egg-info/
```

### Git Operations
```bash
# Check status
git status

# Create commit
git add .
git commit -m "Your message"

# Push changes
git push origin main
```

## Testing
**Note:** This project currently has no automated tests or test framework configured.

To add testing in the future, consider:
```bash
# Install pytest
pip install pytest

# Run tests (once tests are created)
pytest

# Run with coverage
pytest --cov=how
```

## Code Quality
**Note:** No linting or formatting tools are currently configured in the project.

To add code quality tools in the future:
```bash
# Install black for formatting
pip install black
black how/

# Install flake8 for linting
pip install flake8
flake8 how/

# Install mypy for type checking
pip install mypy
mypy how/
```

## Utility Commands (macOS/Darwin)

### File Operations
```bash
# List directory contents
ls -la

# Find files
find . -name "*.py"

# Search in files
grep -r "pattern" .
```

### System Information
```bash
# Check Python version
python --version

# Check installed packages
pip list

# Show environment details
env
```

### Process Management
```bash
# View running processes
ps aux

# Kill process by name
pkill -f python
```

## Configuration Files
- `~/.how/api_key` - Stores the Google Gemini API key (chmod 600)
- `~/.how/history.txt` - Stores command history

## Project-Specific Notes
- This project uses setuptools for packaging
- No virtual environment management is included in the project itself
- The main entry point is registered as a console script named `how`
- All Python code should work under a virtual environment controlled by UV (per user's requirements)
