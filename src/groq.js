import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
  }

  return new Groq({ apiKey });
}

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
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || 'chore: update files';
  } catch (error) {
    console.error(chalk.red('\nGroq error generating commit message:'));
    console.error(chalk.gray(error.message));
    return 'chore: update changes (Groq error)';
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
    const groq = getGroqClient();
    console.log(chalk.blue('\nSending changes to Groq for code review...'));

    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0].message.content?.trim() || 'Code review failed to return any content.';
  } catch (error) {
    console.error(chalk.red('\nGroq error performing code review:'));
    console.error(chalk.gray(error.message));
    return 'Code review failed due to API error.';
  }
}
