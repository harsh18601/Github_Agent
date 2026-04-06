# AI GitHub DevOps Agent

An Advanced Autonomous AI GitHub DevOps Agent that acts as a senior software engineer, DevOps engineer, and code reviewer combined. It safely manages local repositories and synchronizes them with GitHub.

## 🚀 Features

- **File Monitoring**: Continuously watches the project directory for changes.
- **Change Analysis**: Automatically categorizes changes (feat, fix, refactor, etc.) and assesses risk.
- **Intelligent Commits**: Generates semantic commit messages using Groq.
- **Security Scanner**: Automatically scans for API keys and sensitive data before committing.
- **Smart Pull/Push**: Handles rebases and conflicts intelligently.
- **AI Code Review**: Provides inline suggestions and refactoring ideas.
- **CLI Interface**: Easy-to-use commands for daily workflow.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Git**: [simple-git](https://github.com/steveukx/git-js)
- **Monitoring**: [chokidar](https://github.com/paulmillr/chokidar)
- **AI**: Groq API
- **CLI**: [commander](https://github.com/tj/commander.js)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Github_Agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and add your keys:
   ```bash
   cp .env.example .env
   ```

## 🎮 Commands

- `node index.js status`: Show current status.
- `node index.js push now`: Analyze, commit, and push changes.
- `node index.js pull latest`: Safe pull with conflict handling.
- `node index.js sync repo`: Pull, resolve, and push.
- `node index.js review code`: Run AI code review.
- `node index.js create pr`: Push and create a pull request.

## 🛡️ Safety Rules

- Safety > automation.
- Never overwrite critical code without confirmation.
- Transparent action plans before execution.
