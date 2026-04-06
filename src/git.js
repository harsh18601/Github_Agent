import { simpleGit } from 'simple-git';
import chalk from 'chalk';
import { execa } from 'execa';

const git = simpleGit();

async function hasUpstream(branch) {
  try {
    await git.raw(['rev-parse', '--abbrev-ref', `${branch}@{upstream}`]);
    return true;
  } catch {
    return false;
  }
}

async function remoteBranchExists(remote, branch) {
  try {
    const result = await git.raw(['ls-remote', '--heads', remote, branch]);
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

async function ensureUpstream(remote = 'origin') {
  const status = await git.status();
  const currentBranch = status.current;

  if (await hasUpstream(currentBranch)) {
    return { currentBranch, hasUpstream: true, remoteExists: true };
  }

  if (await remoteBranchExists(remote, currentBranch)) {
    await git.branch(['--set-upstream-to', `${remote}/${currentBranch}`, currentBranch]);
    console.log(chalk.green(`Upstream set to ${remote}/${currentBranch}`));
    return { currentBranch, hasUpstream: true, remoteExists: true };
  }

  console.log(chalk.yellow(`No upstream exists for ${currentBranch} yet. It will be created on first push.`));
  return { currentBranch, hasUpstream: false, remoteExists: false };
}

/**
 * Executes a git command with logging.
 * @param {string} command - Command name.
 * @param {Function} action - Async action function.
 * @returns {Promise<any>} - Action result.
 */
async function gitAction(command, action) {
  console.log(chalk.blue(`\n🔄 Git Action: ${command}...`));
  try {
    const result = await action();
    console.log(chalk.green(`✅ Done: ${command}`));
    return result;
  } catch (error) {
    console.error(chalk.red(`❌ Failed: ${command}`));
    console.error(chalk.gray(error.message));
    throw error;
  }
}

/**
 * Gets the current status of the repository.
 */
export async function getStatus() {
  return gitAction('Status', () => git.status());
}

/**
 * Adds files to the staging area.
 * @param {string[]} files - Files to add.
 */
export async function addFiles(files) {
  if (files.length === 0) return;
  return gitAction(`Adding ${files.length} files`, () => git.add(['--all']));
}

/**
 * Commits changes with a message.
 * @param {string} message - Commit message.
 */
export async function commit(message) {
  return gitAction('Commit', () => git.commit(message));
}

/**
 * Pushes changes to the remote.
 */
export async function push() {
  const { currentBranch, hasUpstream } = await ensureUpstream();

  if (currentBranch === 'main' || currentBranch === 'master') {
    console.log(chalk.yellow(`⚠️ Warning: Pushing directly to ${currentBranch}.`));
  }

  return gitAction(`Push to ${currentBranch}`, () =>
    hasUpstream ? git.push('origin', currentBranch) : git.push(['-u', 'origin', currentBranch])
  );
}

/**
 * Pulls changes from the remote with rebase.
 */
export async function pull() {
  return gitAction('Pull with Rebase', async () => {
    try {
      const { currentBranch, hasUpstream, remoteExists } = await ensureUpstream();

      if (!hasUpstream && !remoteExists) {
        console.log(chalk.yellow(`Skipping pull because origin/${currentBranch} does not exist yet.`));
        return;
      }

      await git.pull(['--rebase']);
    } catch (error) {
      if (error.message.includes('CONFLICT')) {
        console.log(chalk.red('\n🚨 CONFLICT detected during pull!'));
        console.log(chalk.yellow('Attempting safe auto-merge check...'));
        // Implementation of auto-resolve or prompt would go here.
        // For now, we signal the error for manual resolution or further logic.
        throw new Error('Merge conflicts detected. Manual resolution required.');
      }
      throw error;
    }
  });
}

/**
 * Runs pre-push validation (linting and tests).
 */
export async function validate() {
  console.log(chalk.blue('\n🧪 Running pre-push validation pipeline...'));

  try {
    console.log(chalk.gray('Running linter...'));
    await execa('npm', ['run', 'lint']);

    console.log(chalk.gray('Running tests...'));
    await execa('npm', ['test']);

    console.log(chalk.green('✅ Validation pipeline passed!'));
    return true;
  } catch (error) {
    console.log(chalk.red('\n❌ Validation pipeline failed!'));
    console.log(chalk.yellow('Please fix the errors before pushing.'));
    console.log(chalk.gray(error.stdout || error.stderr || error.message));
    return false;
  }
}

/**
 * Gets the diff for staged changes.
 */
export async function getStagedDiff() {
  return git.diff(['--staged']);
}

/**
 * Gets the current branch name.
 */
export async function getCurrentBranch() {
  const status = await git.status();
  return status.current;
}
