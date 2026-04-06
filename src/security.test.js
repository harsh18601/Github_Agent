import { scanFiles } from '../src/security.js';
import fs from 'fs';
import path from 'path';

describe('Security Module', () => {
  const testFile = path.resolve('test-secret.txt');

  afterEach(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  test('should detect OpenAI API key', async () => {
    fs.writeFileSync(testFile, 'export const key = "sk-1234567890abcdef1234567890abcdef1234567890abcdef"');
    const result = await scanFiles([testFile]);
    expect(result.safe).toBe(false);
    expect(result.violations[0].reason).toContain('OpenAI API Key');
  });

  test('should detect sensitive filenames', async () => {
    const envFile = path.resolve('.env');
    // Note: scanFiles expects paths. We don't need to create it if we just test the logic
    const result = await scanFiles(['.env']);
    expect(result.safe).toBe(false);
    expect(result.violations[0].reason).toBe('Sensitive filename detected');
  });

  test('should return safe for clean files', async () => {
    fs.writeFileSync(testFile, 'console.log("hello world");');
    const result = await scanFiles([testFile]);
    expect(result.safe).toBe(true);
  });

  test('should not flag placeholder env example values', async () => {
    const exampleFile = path.resolve('temp.env.example');
    fs.writeFileSync(exampleFile, 'GROQ_API_KEY=your_groq_api_key_here\nGITHUB_TOKEN=your_github_token_here');

    const result = await scanFiles([exampleFile]);
    expect(result.safe).toBe(true);

    fs.unlinkSync(exampleFile);
  });

  test('should not flag ordinary long strings in source files', async () => {
    fs.writeFileSync(testFile, "const msg = 'Advanced Autonomous AI GitHub DevOps Agent';");
    const result = await scanFiles([testFile]);
    expect(result.safe).toBe(true);
  });
});
