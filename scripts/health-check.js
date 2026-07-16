import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;
const bold = (text) => `\x1b[1m${text}\x1b[0m`;

console.log(bold(cyan("\n=== SimuPay Pro Health & Integrity Diagnostics ===\n")));

let issuesFound = 0;
let warningsFound = 0;

// 1. Check Directory Structures
const requiredDirs = ['api', 'src', 'src/components', 'docs'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`${green("✓")} Directory verified: ${bold(dir)}`);
  } else {
    console.log(`${red("✗")} Missing required directory: ${bold(dir)}`);
    issuesFound++;
  }
});

// 2. Check Key Files
const requiredFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'src/App.tsx', 'vercel.json'];
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`${green("✓")} File verified: ${bold(file)}`);
  } else {
    console.log(`${red("✗")} Missing required file: ${bold(file)}`);
    issuesFound++;
  }
});

// 3. Environment Variable Assessment
console.log(bold(cyan("\n--- Environment Configuration Assessment ---")));
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log(`${yellow("⚠")} No active .env file detected in workspace root. (Standard in cloud runtime)`);
  warningsFound++;
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL') && !envContent.includes('YOUR_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY') && !envContent.includes('YOUR_SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log(`${green("✓")} Supabase configuration validated inside .env`);
  } else {
    console.log(`${yellow("⚠")} Supabase credentials in .env are empty or placeholders`);
    warningsFound++;
  }
}

// 4. Code Compile and Lint Verification
console.log(bold(cyan("\n--- Static Type & Compilability Audit ---")));
try {
  console.log("Running TypeScript compilation check (npm run lint)...");
  execSync('npm run lint', { stdio: 'inherit' });
  console.log(`${green("✓")} TypeScript compilation check completed with zero errors.`);
} catch (e) {
  console.log(`${red("✗")} TypeScript compilation check failed. Please fix TypeScript errors.`);
  issuesFound++;
}

console.log(bold(cyan("\n--- Summary Report ---")));
console.log(`Diagnostics Completed.`);
console.log(`Status: ${issuesFound > 0 ? red("UNHEALTHY (Errors Found)") : warningsFound > 0 ? yellow("HEALTHY WITH WARNINGS") : green("PRISTINE HEALTH")}`);
console.log(`Total Errors: ${issuesFound}`);
console.log(`Total Warnings: ${warningsFound}\n`);

if (issuesFound > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
