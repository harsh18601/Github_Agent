import path from 'path';
import chalk from 'chalk';

/**
 * Analyzes Git diff and categorizes changes.
 * @param {string} diffText - The git diff content.
 * @param {string[]} files - Changed files.
 * @returns {Object} - Analysis report.
 */
export async function analyzeChanges(diffText, files) {
  const categories = new Set();
  const modules = new Set();
  let riskLevel = 'Low';

  for (const file of files) {
    const ext = path.extname(file);
    const dir = path.dirname(file).split(path.sep)[0] || 'root';
    modules.add(dir);

    // Categorization heuristics
    if (file.toLowerCase().includes('test') || ext === '.test.js' || ext === '.spec.js') {
      categories.add('test');
    } else if (file === 'package.json' || file === 'package-lock.json' || file.endsWith('.config.js')) {
      categories.add('config');
    } else if (ext === '.md' || file.toLowerCase().includes('docs')) {
      categories.add('docs');
    } else {
      // Check content for fix/feature keywords in diff
      if (/fix|bug|issue|resolve/i.test(diffText)) {
        categories.add('bugfix');
      } else if (/feat|add|implement/i.test(diffText)) {
        categories.add('feature');
      } else {
        categories.add('refactor');
      }
    }

    // Risk Assessment
    if (file === 'package.json' || file.includes('database') || file.includes('auth')) {
      riskLevel = 'Medium';
    }
    if (diffText.length > 5000 || files.length > 20) {
      riskLevel = 'High';
    }
  }

  return {
    categories: Array.from(categories),
    modules: Array.from(modules),
    riskLevel,
    summary: `Analyzed ${files.length} files across ${modules.size} modules.`
  };
}

/**
 * Displays the analysis report for user review.
 */
export function displayAnalysis(report) {
  console.log(chalk.blue('\n📊 Change Analysis Report:'));
  console.log(`- ${chalk.bold('Categories:')} ${report.categories.join(', ')}`);
  console.log(`- ${chalk.bold('Impacted Modules:')} ${report.modules.join(', ')}`);
  console.log(`- ${chalk.bold('Risk Level:')} ${report.riskLevel === 'High' ? chalk.red.bold('High') : report.riskLevel === 'Medium' ? chalk.yellow.bold('Medium') : chalk.green('Low')}`);
  console.log(`- ${chalk.bold('Summary:')} ${report.summary}`);
}
