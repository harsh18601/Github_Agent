# GitHub Agent

GitHub Agent is a reusable CLI that can run inside any Git repository and automate the normal Git loop for you:

- watch files
- analyze changes
- generate commit messages
- run lint/tests
- pull with rebase
- set upstream automatically
- push to GitHub

## Install

### Use in this repo

```bash
npm install
node index.js status
```

### Use globally on your machine

From this project:

```bash
npm install
npm link
```

Then inside any other Git project:

```bash
cd /path/to/your-project
github-agent init
github-agent watch
```

## Environment Variables

Create a `.env` file in the project where you want the agent to run:

```env
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here
PORT=3000
DEBUG=true
```

## Per-Project Config

Run this in any repository:

```bash
github-agent init
```

That creates a `.github-agent.json` file like this:

```json
{
  "lintCommand": "npm run lint",
  "testCommand": "npm test",
  "watch": {
    "batchTimeout": 5000,
    "ignored": []
  }
}
```

You can change it per project. Example:

```json
{
  "lintCommand": "pnpm lint",
  "testCommand": "pnpm test",
  "watch": {
    "batchTimeout": 3000,
    "ignored": ["**/.next/**", "**/coverage/**"]
  }
}
```

If a project has no lint or test script, the agent skips that step automatically unless you configure a command.

## Commands

You can use either the local form:

```bash
node index.js status
node index.js push now
node index.js watch
```

Or the global form after `npm link`:

```bash
github-agent status
github-agent push now
github-agent pull latest
github-agent sync repo
github-agent review code
github-agent watch
github-agent config
github-agent init
```

## How To Use In Another Project

1. Install/link this agent once.
2. Go to the other repository.
3. Add that repo's `.env`.
4. Run `github-agent init`.
5. Run `github-agent watch`.

After that, the agent watches that repository and handles commit/pull/push automatically.

## Notes

- The agent works against the current working directory, so always run it from the root of the repository you want to automate.
- Upstream branch setup is automatic on first push.
- The repository must still be a valid Git repo with a working remote.
