import { Command } from 'commander';
import chalk from 'chalk';
import * as git from './git.js';
import * as security from './security.js';
import * as openai from './groq.js';
import * as analyzer from './analyzer.js';
import Monitor from './monitor.js';
import { getConfigPath, initializeConfig, loadConfig } from './config.js';

const program = new Command();

async function runPushNow() {
  const status = await git.getStatus();
  const modifiedFiles = status.files.map((f) => f.path);

  if (modifiedFiles.length === 0) {
    console.log(chalk.yellow('\nNo changes detected. Nothing to push.'));
    return;
  }

  const scanResult = await security.scanFiles(modifiedFiles);
  if (!scanResult.safe) {
    security.displayViolations(scanResult.violations);
    return;
  }

  await git.addFiles(modifiedFiles);

  const diffText = await git.getStagedDiff();
  const analysis = await analyzer.analyzeChanges(diffText, modifiedFiles);
  analyzer.displayAnalysis(analysis);

  console.log(chalk.blue('\nGenerating semantic commit message...'));
  const commitMsg = await openai.generateCommitMessage(diffText);
  console.log(chalk.green(`Commit Message: ${commitMsg}`));

  await git.commit(commitMsg);

  const isValid = await git.validate();
  if (!isValid) return;

  try {
    await git.pull();
    await git.push();
    console.log(chalk.green.bold('\nSuccessfully synced and pushed to remote!'));
  } catch (error) {
    console.error(chalk.red('\nPush failed. Remote sync error.'));
  }
}

async function runPullLatest() {
  await git.pull();
}

async function runSyncRepo() {
  console.log(chalk.blue('\nSyncing repository...'));
  await runPushNow();
}

async function runReviewCode() {
  const diffText = await git.getStagedDiff();
  const review = await openai.performCodeReview(diffText);
  console.log(chalk.blue('\nAI Code Review Report:'));
  console.log(chalk.white(review));
}

function validateKeyword(value, expected, example) {
  if (!value || value === expected) {
    return true;
  }

  console.error(chalk.red(`\nInvalid usage. Try \`github-agent ${example}\`.`));
  return false;
}

program
  .name('github-agent')
  .description('Advanced Autonomous AI GitHub DevOps Agent')
  .version('1.0.0');

program
  .command('init')
  .description('Create a repo-local .github-agent.json configuration file')
  .action(() => {
    const result = initializeConfig();

    if (result.created) {
      console.log(chalk.green(`Created ${result.path}`));
    } else {
      console.log(chalk.yellow(`Config already exists at ${result.path}`));
    }
  });

program
  .command('config')
  .description('Show the resolved config for the current repository')
  .action(() => {
    console.log(chalk.cyan(`\nConfig Path: ${getConfigPath()}`));
    console.log(JSON.stringify(loadConfig(), null, 2));
  });

program
  .command('status')
  .description('Show current git status and branch info')
  .action(async () => {
    const status = await git.getStatus();
    console.log(chalk.cyan(`\nCurrent Branch: ${chalk.bold(status.current)}`));
    console.log(chalk.gray(`Changes: ${status.files.length} files modified.`));
  });

program
  .command('push-now')
  .description('Analyze, commit, validate, and push local changes')
  .action(runPushNow);

program
  .command('push [mode]')
  .description('Analyze, commit, validate, and push local changes')
  .action(async (mode) => {
    if (!validateKeyword(mode, 'now', 'push now')) return;
    await runPushNow();
  });

program
  .command('pull-latest')
  .description('Safe pull with rebase and conflict handling')
  .action(runPullLatest);

program
  .command('pull [target]')
  .description('Safe pull with rebase and conflict handling')
  .action(async (target) => {
    if (!validateKeyword(target, 'latest', 'pull latest')) return;
    await runPullLatest();
  });

program
  .command('sync-repo')
  .description('Analyze, commit, pull (rebase), and push')
  .action(runSyncRepo);

program
  .command('sync [target]')
  .description('Analyze, commit, pull (rebase), and push')
  .action(async (target) => {
    if (!validateKeyword(target, 'repo', 'sync repo')) return;
    await runSyncRepo();
  });

program
  .command('review-code')
  .description('Run AI code review on local changes')
  .action(runReviewCode);

program
  .command('review [target]')
  .description('Run AI code review on local changes')
  .action(async (target) => {
    if (!validateKeyword(target, 'code', 'review code')) return;
    await runReviewCode();
  });

program
  .command('watch')
  .description('Start file monitoring and auto-sync changes')
  .action(() => {
    const config = loadConfig();
    const monitor = new Monitor(process.cwd(), {
      batchTimeout: config.watch.batchTimeout,
      ignored: config.watch.ignored,
    });

    monitor.start();

    monitor.on('changes', async (files) => {
      console.log(chalk.blue(`\nDetected changes in ${files.length} files. Starting auto-sync...`));
      await runPushNow();
    });
  });

export default program;
