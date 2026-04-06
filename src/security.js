import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const SENSITIVE_PATTERNS = [
  {
    name: 'Generic API Key',
    regex: /\b(?:api[_-]?key|token|secret|password)\b\s*[:=]\s*["']?[A-Za-z0-9_\-]{20,}["']?/i,
    exclude: [/node_modules/, /README\.md/, /package-lock\.json/, /\.gitignore/, /\.env\.example$/, /verify\.js$/, /\.test\.js$/, /agent\.md$/]
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{48}/,
    exclude: [/\.env\.example$/, /verify\.js$/, /\.test\.js$/]
  },
  {
    name: 'GitHub Token',
    regex: /ghp_[a-zA-Z0-9]{36}/,
    exclude: [/\.env\.example$/, /\.test\.js$/]
  },
  {
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/,
    exclude: [/package-lock\.json$/, /\.test\.js$/]
  },
  {
    name: 'AWS Secret Access Key',
    regex: /\baws[_-]secret[_-]access[_-]key\b\s*[:=]\s*["']?[0-9A-Za-z/+]{40}["']?/i,
    exclude: [/package-lock\.json$/, /\.test\.js$/]
  }
];

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  'secrets.json',
  'credentials.json'
];

/**
 * Scans a list of files for sensitive information.
 * @param {string[]} files - List of file paths to scan.
 * @returns {Promise<{safe: boolean, violations: Array}>} - Scan results.
 */
export async function scanFiles(files) {
  const violations = [];

  for (const file of files) {
    const filename = path.basename(file);

    // Check for sensitive filenames
    if (SENSITIVE_FILES.includes(filename)) {
      violations.push({
        file,
        reason: 'Sensitive filename detected'
      });
      continue;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');

      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.exclude && pattern.exclude.some(ex => ex.test(file))) {
          continue;
        }

        if (pattern.regex.test(content)) {
          violations.push({
            file,
            reason: `Potential ${pattern.name} found`
          });
          break; // Avoid multiple violations for the same file if not needed
        }
      }
    } catch (error) {
      // Skip if file doesn't exist or can't be read (e.g., directory)
    }
  }

  return {
    safe: violations.length === 0,
    violations
  };
}

/**
 * Utility to display scan violations.
 * @param {Array} violations - List of violations.
 */
export function displayViolations(violations) {
  console.log(chalk.red.bold('\n🚨 SECURITY ALERT: Sensitive information detected!'));
  console.log(chalk.yellow('The following files contain potential secrets and have been blocked from committing:'));

  violations.forEach(v => {
    console.log(`- ${chalk.cyan(v.file)}: ${chalk.white(v.reason)}`);
  });

  console.log(chalk.red('\nPlease remove the sensitive information or add the file to .gitignore before proceeding.\n'));
}
