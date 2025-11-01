# Project Overview: How-CLI

**Last Updated**: 2025-11-01  
**Project Location**: `/Users/giorgosmarinos/aiwork/coding-platform/how`  
**Programming Languages**: Python (original), TypeScript (enhanced port)

## Project Purpose

How-CLI is a terminal-based assistant that generates precise, executable shell commands for any task using AI. It provides context-aware command generation by analyzing the user's current environment (OS, shell, working directory, files, git status, installed tools).

## Key Implementations

### 1. Python Version (`how/`)
- **Package Name**: `how-cli-assist`
- **Version**: 1.0.1
- **Single Provider**: Google Gemini only
- **Entry Point**: `how.main:main`
- **CLI Command**: `how`

**Features**:
- Context-aware command generation
- Command history logging
- Clipboard auto-copy
- Typewriter effect (optional)
- Spinner animations
- Error handling with retry logic
- API key management

### 2. TypeScript Version (`how-ts/`)
- **Package Name**: `how-cli-ts`
- **Version**: 1.0.0
- **Multi-Provider Support**: Gemini, OpenAI, Azure OpenAI, Claude, Vertex AI Claude
- **Entry Points**:
  - `how-ts`: Main CLI command
  - `os-prompt`: Context generation utility (no AI call)

**Enhanced Features** (beyond Python version):
- Multi-provider architecture with factory pattern
- Type-safe implementation
- Advanced configuration system (CLI → Env → Config file → Defaults)
- Model name aliasing for Claude providers
- Region selection for Vertex AI
- Verbose mode for request debugging
- Separate `os-prompt` utility for prompt generation

## Current Status

- ✅ Python version: Stable, production-ready
- ✅ TypeScript version: Enhanced features, multi-provider support
- ✅ Both versions actively maintained
- ✅ Comprehensive documentation in README files

## Target Users

- Developers who need quick shell commands
- System administrators managing servers
- Users learning shell commands
- DevOps engineers automating tasks
- Anyone who wants context-aware command suggestions

## Project Philosophy

As stated in the Python README disclaimer:
> "I made How-CLI because it was fun and quick to build... It's not meant to change the world. It's meant to make typing 'how to do X in bash' a little more amusing... Think of it as a weekend hack."

Despite this humble disclaimer, the project has evolved into a robust, multi-provider CLI tool with comprehensive features and type-safe implementation.