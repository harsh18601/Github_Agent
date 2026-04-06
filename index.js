#!/usr/bin/env node

import program from './src/cli.js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// CLI Entry Point
async function main() {
  try {
    // Override default help behavior to show custom styling if needed
    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
      program.outputHelp();
    }
  } catch (error) {
    console.error(chalk.red('\n💥 Critical Error:'));
    console.error(chalk.gray(error.stack || error.message));
    process.exit(1);
  }
}

main();
