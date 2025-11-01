# Task Completion Checklist for How-CLI

## When a Task is Completed

Since this is a simple CLI tool without formal testing, linting, or CI/CD infrastructure, the completion checklist is minimal:

### 1. Code Quality Checks (Manual)
- [ ] Ensure code follows the existing style conventions (see `code_style_and_conventions.md`)
- [ ] Verify that any new functions use appropriate type hints
- [ ] Check that error handling is appropriate (custom exceptions where needed)
- [ ] Ensure file I/O uses UTF-8 encoding
- [ ] Verify that sensitive operations (like API key storage) use proper permissions (0o600)

### 2. Functional Testing (Manual)
- [ ] Test the `how` command with various questions
- [ ] Test all command-line flags:
  - `--help`
  - `--history`
  - `--api-key <key>`
  - `--silent`
  - `--type`
- [ ] Verify error handling:
  - Invalid API key
  - Network timeout
  - Content blocking
  - Empty responses
- [ ] Test clipboard functionality
- [ ] Test history logging

### 3. Documentation
- [ ] Update README.md if new features are added
- [ ] Update version number in `pyproject.toml` if releasing
- [ ] Document any breaking changes
- [ ] Update demo video/screenshot if UI changes significantly

### 4. Version Control
- [ ] **Do NOT perform version control operations unless explicitly requested by user**
- [ ] If explicitly requested:
  - Commit with clear, descriptive message
  - Tag releases appropriately (e.g., v1.0.1)

### 5. Distribution (if releasing)
- [ ] Update version in `pyproject.toml`
- [ ] Build distribution: `python -m build`
- [ ] Test installation locally: `pip install dist/how-cli-assist-*.whl`
- [ ] Upload to PyPI: `python -m twine upload dist/*`

### 6. User Requirements Compliance
- [ ] If using Python packages, ensure installation uses `uv add` command
- [ ] Ensure all Python code works under virtual environment controlled by UV
- [ ] Check `Issues - Pending Items.md` for related issues to resolve/remove
- [ ] Verify no fallback solutions for configuration settings are used
  - All missing config values should raise appropriate exceptions
  - Check if any exceptions to this rule were documented in project memory

## What to Skip
- ❌ No automated tests to run (none exist)
- ❌ No linting/formatting tools configured (black, flake8, mypy not used)
- ❌ No CI/CD pipelines to check
- ❌ No database migrations (no database)
- ❌ No deployment scripts (simple pip install)

## Future Improvements
If the project grows, consider adding:
- pytest for automated testing
- black for code formatting
- flake8 or ruff for linting
- mypy for type checking
- GitHub Actions for CI/CD
- Pre-commit hooks
