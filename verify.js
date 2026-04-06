import { scanFiles, displayViolations } from './src/security.js';
import fs from 'fs';

async function verify() {
  console.log('--- Verifying Security Scanner ---');
  const testFile = 'test-secret.txt';
  fs.writeFileSync(testFile, 'export const key = "sk-1234567890abcdef1234567890abcdef1234567890abcdef"');

  const result = await scanFiles([testFile, '.env']);
  if (!result.safe) {
    displayViolations(result.violations);
  } else {
    console.log('✅ Scan was safe (Unexpected!)');
  }

  fs.unlinkSync(testFile);
  console.log('--- Verification Complete ---');
}

verify();
