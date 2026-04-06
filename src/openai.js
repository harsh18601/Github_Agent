import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a semantic commit message based on the provided diff.
 * @param {string} diffText - The git diff content.
 * @returns {Promise<string>} - The generated commit message.
 */
export async function generateCommitMessage(diffText) {
  if (!diffText || diffText.trim().length === 0) {
    return 'chore: update files';
  }

  const prompt = `
    Analyze the following Git diff and generate a semantic commit message in the format:
    type(scope): short summary

    - bullet points of changes

    Types: feat, fix, docs, style, refactor, perf, test, chore.
    Example: feat(auth): add JWT login flow

    Diff:
    ${diffText.substring(0, 4000)} // Truncate to avoid token limits if necessary
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using gpt-4o as default
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red('\n❌ OpenAI error generating commit message:'));
    console.error(chalk.gray(error.message));
    return 'chore: update changes (OpenAI error)';
  }
}

/**
 * Performs an AI code review on the provided diff.
 * @param {string} diffText - The git diff content.
 * @returns {Promise<string>} - The AI code review report.
 */
export async function performCodeReview(diffText) {
  if (!diffText || diffText.trim().length === 0) {
    return 'No changes detected for review.';
  }

  const prompt = `
    Conduct a senior developer code review on the following Git diff.
    Look for:
    - Potential bugs
    - Bad practices
    - Performance issues
    - Security risks
    - Refactoring opportunities

    Provide specific suggestions and alternatives.
    Be concise but informative.

    Diff:
    ${diffText.substring(0, 4000)}
  `;

  try {
    console.log(chalk.blue('\n🔍 Sending changes to OpenAI for code review...'));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(chalk.red('\n❌ OpenAI error performing code review:'));
    console.error(chalk.gray(error.message));
    return 'Code review failed due to API error.';
  }
}
