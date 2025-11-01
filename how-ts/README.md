# How-CLI (TypeScript) - Multi-Provider AI Support

<h1 align="center">How-CLI-TS</h1>
<p align="center">A Terminal-Based Assistant for Generating Shell Commands with Multiple AI Providers</p>

**How-CLI-TS** is a TypeScript/Node.js terminal assistant that generates precise shell commands for any task. Now with support for **multiple AI providers**: Google Gemini, OpenAI, Azure OpenAI, Anthropic Claude, and Vertex AI Claude.

---

## ✨ Features

- 🤖 **Multiple AI Providers**: Choose from Gemini, OpenAI, Azure OpenAI, Claude, or Vertex Claude
- 🎯 Generate **exact shell commands** based on your current context
- 📍 Context-aware: considers files, git repos, shell type, and installed tools
- 📝 **Command history** logging
- 📋 Clipboard support: auto-copy generated commands
- ⌨️ Typewriter effect (optional)
- ⚙️ Flexible configuration: CLI flags, environment variables, or config file
- 🛡️ **Type-safe** implementation with full TypeScript support
- 🔄 Retry logic with exponential backoff
- ⚡ Timeout handling and error recovery

---

## 🚀 Supported AI Providers

| Provider | Models | Configuration |
|----------|--------|---------------|
| **Google Gemini** | gemini-2.5-flash-lite, etc. | `GOOGLE_API_KEY` |
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-3.5-turbo | `OPENAI_API_KEY` |
| **Azure OpenAI** | gpt-4, gpt-3.5-turbo (via Azure) | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT` |
| **Anthropic Claude** | claude-3-5-sonnet, etc. | `ANTHROPIC_API_KEY` |
| **Vertex AI Claude** | claude via Google Vertex AI | `ANTHROPIC_VERTEX_PROJECT_ID`, `VERTEX_LOCATION` |

Tip: Claude providers support short model names (e.g., `sonnet-4-5`, `haiku-4-5`, `opus-4-1`) which auto-expand to full IDs.

---

## 📦 Installation

### From Source

```bash
# Clone the repository
git clone <repository-url>
cd how-ts

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### Development Mode

```bash
# Run without building
npm run dev -- <your question>
```

---

## 🎯 Quick Start

### Basic Usage

```bash
# Using default provider (Gemini)
node dist/index.js how to list all files

# Using OpenAI
node dist/index.js --provider openai how to create a git repository

# Using Claude with specific model
node dist/index.js --provider claude --model claude-3-5-sonnet-20241022 how to check disk usage

# Using Azure OpenAI
node dist/index.js --provider azure how to find large files
```

### OS Prompt (Prompt-only)

```bash
# Generate prompt only (no model call)
os-prompt "How to check disk space"

# Structured JSON payload
os-prompt --json "How to check disk space"

# Single-line JSON
os-prompt --format jsonl "How to check disk space"
```

### Global Installation

If you've linked the package globally:

```bash
how-ts how to compress a directory
how-ts --provider openai how to search for text in files
```

---

## ⚙️ Configuration

### Configuration Priority (highest to lowest)

1. **CLI Arguments** (`--provider`, `--model`)
2. **Environment Variables**
3. **Config File** (`~/.how-cli/config.json`)
4. **Defaults**

### Environment Variables

#### Provider Selection
```bash
export AI_PROVIDER=openai  # gemini, openai, azure, claude, vertex-claude
```

#### Google Gemini
```bash
export GOOGLE_API_KEY=your-key-here
export GEMINI_MODEL=models/gemini-2.5-flash-lite  # optional
```

#### OpenAI
```bash
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini  # optional
export OPENAI_ORGANIZATION=org-...  # optional
```

#### Azure OpenAI
```bash
export AZURE_OPENAI_API_KEY=your-key
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export AZURE_OPENAI_API_VERSION=2024-02-15-preview  # optional
export AZURE_OPENAI_DEPLOYMENT=gpt-4  # deployment name
```

#### Anthropic Claude
```bash
export ANTHROPIC_API_KEY=sk-ant-...
export CLAUDE_MODEL=claude-3-5-sonnet-20241022  # optional
```

#### Vertex AI Claude
```bash
export ANTHROPIC_VERTEX_PROJECT_ID=your-gcp-project
export CLOUD_ML_REGION=us-central1  # Recommended: CLOUD_ML_REGION
# or
export VERTEX_LOCATION=us-central1  # Alternative: VERTEX_LOCATION

export VERTEX_CLAUDE_MODEL=claude-3-5-sonnet@20241022  # optional, use @ format

# Note: Vertex AI requires @ symbol with date version
# Valid examples:
#   claude-sonnet-4-5@20250929
#   claude-haiku-4-5@20251001
#   claude-opus-4-1@20250805
#   claude-3-5-sonnet@20241022

# Common regions: us-central1, us-east1, us-west1, europe-west1, asia-southeast1
```

#### Short Names (Environment Variables)
You can set short model names in environment variables; the CLI expands them automatically:

- `CLAUDE_MODEL=sonnet-4-5` → `claude-sonnet-4-5`
- `VERTEX_CLAUDE_MODEL=haiku-4-5` → `claude-haiku-4-5@20251001`
- `VERTEX_CLAUDE_MODEL=opus-4-1` → `claude-opus-4-1@20250805`

Example:
```bash
export CLAUDE_MODEL=sonnet-4-5
export VERTEX_CLAUDE_MODEL=opus-4-1
```

### Config File

Create `~/.how-cli/config.json`:

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
  },
  "azure": {
    "apiKey": "...",
    "endpoint": "https://...",
    "deployment": "gpt-4"
  }
}
```

---

## 🧩 Model Short Names

You can use short model names for Claude providers. The CLI expands them automatically:

- sonnet-4-5
  - Claude: claude-sonnet-4-5
  - Vertex Claude: claude-sonnet-4-5@20250929
- haiku-4-5
  - Claude: claude-haiku-4-5
  - Vertex Claude: claude-haiku-4-5@20251001
- opus-4-1
  - Claude: claude-opus-4-1
  - Vertex Claude: claude-opus-4-1@20250805

Examples:

```bash
# Short name with Claude (Anthropic)
how-ts --provider claude --model sonnet-4-5 how to list files

# Short name with Vertex Claude (date auto-added)
how-ts --provider vertex-claude --region us-east1 --model haiku-4-5 "How to create a folder"
```

Config and environment variables also accept short names:

```bash
export CLAUDE_MODEL=sonnet-4-5
export VERTEX_CLAUDE_MODEL=opus-4-1
```

Note: Vertex AI prefers explicit @YYYYMMDD versions for reproducibility. Short names are expanded to recommended versions.

---

## 🎮 CLI Options

```bash
Options:
  --provider <name>    AI provider: gemini, openai, azure, claude, vertex-claude
  --model <name>       Model name for the selected provider
  --region <name>      Region for Vertex AI Claude (e.g., us-central1, us-east1)
  --config <path>      Path to config file (default: ~/.how-cli/config.json)
  --silent             Suppress spinner and typewriter effect
  --type               Show output with typewriter effect
  --verbose            Print the complete request sent to the model
  --history            Show command/question history
  --help               Show this help message and exit
```

---

## 📖 Examples

### Different Providers

```bash
# Google Gemini (default)
how-ts how to create a Python virtual environment
> python -m venv venv

# OpenAI GPT-4
how-ts --provider openai how to find all .js files
> find . -name "*.js"

# Anthropic Claude
how-ts --provider claude how to count lines in a file
> wc -l filename

# Azure OpenAI
how-ts --provider azure how to compress a folder
> tar -czf folder.tar.gz folder/

# Vertex AI Claude (with region)
how-ts --provider vertex-claude --region us-east1 how to check memory usage
> free -h

# Vertex AI Claude (default region: us-central1)
how-ts --provider vertex-claude how to check memory usage
> free -h
```

### Custom Models

```bash
# Specific OpenAI model
how-ts --provider openai --model gpt-4o how to optimize this script

# Specific Claude model
how-ts --provider claude --model claude-3-5-sonnet-20241022 how to debug

# Short names (auto-expanded)
how-ts --provider claude --model sonnet-4-5 how to debug
how-ts --provider vertex-claude --model haiku-4-5 --region us-east1 how to debug

# Azure deployment
how-ts --provider azure --model my-gpt4-deployment how to deploy
```

### With Options

```bash
# Silent mode (no spinner)
how-ts --silent how to list files

# Typewriter effect
how-ts --type how to create directory

# Custom config file
how-ts --config ./my-config.json how to search
```

---

## 🖥️ OS Prompt Tool

`os-prompt` generates the same context-wrapped prompt used by How-CLI without calling any model. Perfect for tunneling into agents like Codex, Claude, etc.

### Usage

```bash
# Plain prompt
os-prompt "How to check disk space"

# JSON payload (structured)
os-prompt --json "How to check disk space"

# Single-line JSON ({"prompt": "..."})
os-prompt --format jsonl "How to check disk space"

# Write to file
os-prompt --out ./tmp/prompt.txt "How to check disk space"
# Append JSONL records
os-prompt --format jsonl --append --out ./tmp/prompts.jsonl "Q1"
# Append with no trailing newline
os-prompt --format jsonl --append --no-newline --out ./tmp/stream.jsonl "Q2"

# Build context from another directory
os-prompt --cwd ./src --format text "List files"

# Override shell name
os-prompt --shell bash --format text "List files"

# Control success message stream
os-prompt --out ./tmp/prompt.txt --quiet
os-prompt --out ./tmp/prompt.txt --stdout "Q"
os-prompt --out ./tmp/prompt.txt --stderr "Q"
```

### Options

- `--files <n>` Number of files listed in context (default 20)
- `--json` Output structured JSON payload
- `--format <text|jsonl>` Output formats
- `--out <file>` Write output to file
- `--append` Append instead of overwrite
- `--no-newline` No trailing newline on append
- `--quiet` Suppress success message when writing to file
- `--stdout` Print success messages to STDOUT
- `--stderr` Print success messages to STDERR
- `--cwd <path>` Context directory to use
- `--shell <name>` Override shell in context

---

## 🏗️ Project Structure

```
how-ts/
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration constants & env vars
│   │   └── config-loader.ts  # Config file loading & resolution
│   ├── providers/
│   │   ├── base.ts           # Provider interface
│   │   ├── gemini.ts         # Google Gemini provider
│   │   ├── openai.ts         # OpenAI provider
│   │   ├── azure-openai.ts   # Azure OpenAI provider
│   │   ├── claude.ts         # Anthropic Claude provider
│   │   ├── vertex-claude.ts  # Vertex AI Claude provider
│   │   ├── factory.ts        # Provider factory
│   │   └── index.ts          # Provider exports
│   ├── utils/
│   │   ├── display.ts        # Display utilities
│   │   ├── history.ts        # History management
│   │   ├── system.ts         # System introspection
│   │   └── text.ts           # Text processing
│   ├── errors/
│   │   └── index.ts          # Custom error classes
│   └── index.ts              # Main CLI entry point
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Development

### Build

```bash
npm run build
```

### Clean Build

```bash
npm run clean
npm run build
```

### Run in Development

```bash
npm run dev -- --provider openai how to list files
```

---

## 📊 Tech Stack

### Core Dependencies
- `@google/generative-ai` - Google Gemini API
- `openai` - OpenAI & Azure OpenAI
- `@anthropic-ai/sdk` - Anthropic Claude API
- `@google-cloud/vertexai` - Vertex AI
- `clipboardy` - Clipboard support

### Development
- `typescript` - Type-safe development
- `ts-node` - Development execution
- `@types/node` - Node.js types

---

## 🎯 Provider-Specific Notes

### Google Gemini
- Free tier available
- Fast response times
- Good for general commands

### OpenAI
- Requires API key (paid)
- Excellent command generation
- Supports latest GPT models

### Azure OpenAI
- Enterprise-grade
- Requires Azure subscription
- Uses deployment names instead of model names

### Anthropic Claude
- High-quality responses
- Good reasoning capabilities
- Requires API key

### Vertex AI Claude
- Claude via Google Cloud
- Requires GCP project
- Region-specific availability

Additional notes:
- Supports short model names (e.g., sonnet-4-5) which auto-expand to full Vertex IDs with date version.
- If a model isn’t available in the specified region, the tool automatically retries once with --region global.

---

## 🐛 Troubleshooting

### Missing API Key

```
❌ Configuration Error: Google Gemini API key is required
```
**Solution**: Set the appropriate environment variable or use `--config` flag

### Provider Not Available

```
❌ Provider Error: Unknown provider: typo
```
**Solution**: Check provider name. Supported: `gemini`, `openai`, `azure`, `claude`, `vertex-claude`

### Azure Endpoint Issues

```
❌ Configuration Error: Azure OpenAI endpoint is required
```
**Solution**: Set all required Azure variables: `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`

### Vertex AI Auth

```
❌ Authentication or permission error
```
**Solution**: Ensure you're authenticated with Google Cloud: `gcloud auth application-default login`

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

---

## 👤 Author

Original Python version by **Adem Kouki**
TypeScript port with multi-provider support: November 2025

---

## 🙏 Acknowledgments

- Google Gemini for AI capabilities
- OpenAI for GPT models
- Anthropic for Claude
- All contributors to the AI provider SDKs
