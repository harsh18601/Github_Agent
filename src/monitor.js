import chokidar from 'chokidar';
import path from 'path';
import chalk from 'chalk';
import { EventEmitter } from 'events';

/**
 * File monitoring system based on chokidar.
 * Emits 'changes' event with a list of changed files after a batch period.
 */
class Monitor extends EventEmitter {
  constructor(directory = '.', options = {}) {
    super();
    this.directory = directory;
    this.batchTimeout = options.batchTimeout || 5000; // 5 seconds batching
    this.ignored = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.gitignore',
      '**/package-lock.json',
      '**/yarn.lock',
      '**/.DS_Store'
    ];
    this.changedFiles = new Set();
    this.batchTimer = null;
    this.watcher = null;
  }

  /**
   * Starts monitoring the directory.
   */
  start() {
    console.log(chalk.blue(`\n👁️ File Monitoring started in ${chalk.bold(this.directory)}...`));

    this.watcher = chokidar.watch(this.directory, {
      ignored: this.ignored,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', filepath => this.handleChange('added', filepath))
      .on('change', filepath => this.handleChange('modified', filepath))
      .on('unlink', filepath => this.handleChange('deleted', filepath))
      .on('error', error => {
        console.error(chalk.red(`\n❌ Monitor error: ${error.message}`));
      });
  }

  /**
   * Handles a single file change event and starts batching.
   * @param {string} type - Event type.
   * @param {string} filepath - Path of the changed file.
   */
  handleChange(type, filepath) {
    const relativePath = path.relative(this.directory, filepath);
    this.changedFiles.add(relativePath);

    console.log(chalk.gray(`- [${type}] ${relativePath}`));

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.emitChanges();
    }, this.batchTimeout);
  }

  /**
   * Emits the 'changes' event with the collected files and clears the batch.
   */
  emitChanges() {
    if (this.changedFiles.size > 0) {
      const files = Array.from(this.changedFiles);
      this.emit('changes', files);
      this.changedFiles.clear();
      this.batchTimer = null;
    }
  }

  /**
   * Stops the watcher.
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log(chalk.yellow('\n👁️ File Monitoring stopped.'));
    }
  }
}

export default Monitor;
export { Monitor };
