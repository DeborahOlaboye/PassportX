#!/usr/bin/env node

/**
 * Dependency Verification Script
 * Verifies that all WalletConnect dependencies are installed and compatible
 */

import fs from 'fs';
import path from 'path';

interface Package {
  name: string;
  version: string;
  required?: boolean;
}

interface PackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

const REQUIRED_WALLETCONNECT_PACKAGES: Package[] = [
  { name: '@reown/walletkit', required: true },
  { name: '@walletconnect/utils', required: true },
  { name: '@walletconnect/core', required: true },
  { name: 'qrcode', required: false },
  { name: '@metamask/eth-sig-util', required: false },
  { name: 'zustand', required: false },
  { name: 'axios', required: false },
];

const REQUIRED_TYPES: Package[] = [
  { name: '@types/qrcode', required: false },
];

function readPackageJson(): PackageJson {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const content = fs.readFileSync(packageJsonPath, 'utf-8');
  return JSON.parse(content);
}

function verifyPackages(): { success: boolean; messages: string[] } {
  const packageJson = readPackageJson();
  const messages: string[] = [];
  let allRequiredInstalled = true;

  console.log('\n📦 WalletConnect Dependencies Verification\n');
  console.log('Checking production dependencies...\n');

  for (const pkg of REQUIRED_WALLETCONNECT_PACKAGES) {
    const installed = pkg.name in packageJson.dependencies;
    const version = packageJson.dependencies[pkg.name];

    if (installed) {
      const status = pkg.required ? '✅' : '✓';
      console.log(`${status} ${pkg.name}: ${version}`);
      messages.push(`${pkg.name} is installed (${version})`);
    } else {
      const status = pkg.required ? '❌' : '⚠️';
      console.log(`${status} ${pkg.name}: NOT INSTALLED`);
      messages.push(`${pkg.name} is NOT installed`);

      if (pkg.required) {
        allRequiredInstalled = false;
      }
    }
  }

  console.log('\nChecking development dependencies...\n');

  for (const pkg of REQUIRED_TYPES) {
    const installed = pkg.name in packageJson.devDependencies;
    const version = packageJson.devDependencies[pkg.name];

    if (installed) {
      console.log(`✓ ${pkg.name}: ${version}`);
      messages.push(`${pkg.name} is installed (${version})`);
    } else {
      console.log(`⚠️  ${pkg.name}: NOT INSTALLED (optional)`);
      messages.push(`${pkg.name} is NOT installed (optional)`);
    }
  }

  console.log('\nChecking Node version compatibility...\n');

  const packageJson2 = readPackageJson();
  const engines = packageJson2.engines || {};
  const nodeVersion = engines.node || 'Not specified';

  console.log(`Node requirement: ${nodeVersion}`);
  console.log(`Current Node: ${process.version}`);

  const currentNodeVersion = process.versions.node;
  const majorVersion = parseInt(currentNodeVersion.split('.')[0], 10);

  if (majorVersion >= 16) {
    console.log('✅ Node version is compatible (v16+)\n');
    messages.push(`Node version ${process.version} is compatible`);
  } else {
    console.log('❌ Node version is too old (requires v16+)\n');
    messages.push(`Node version ${process.version} is NOT compatible`);
    allRequiredInstalled = false;
  }

  return {
    success: allRequiredInstalled,
    messages,
  };
}

function displaySummary(result: { success: boolean; messages: string[] }): void {
  const separator = '='.repeat(60);
  console.log(separator);
  if (result.success) {
    console.log('✅ All required dependencies are properly installed!');
    console.log('\nYou can now run:');
    console.log('  npm run dev       - Start development server');
    console.log('  npm run build     - Build for production');
    console.log('  npm test          - Run tests');
  } else {
    console.log(
      '❌ Some dependencies are missing or incompatible. Please run:'
    );
    console.log('  npm install');
  }
  console.log(separator);
}

// Run verification
const result = verifyPackages();
displaySummary(result);

process.exit(result.success ? 0 : 1);
