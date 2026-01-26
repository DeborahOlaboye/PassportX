#!/usr/bin/env node

/**
 * validate-package-json.js
 * 
 * Validates package.json structure and identifies potential issues
 * with dependencies, peer dependencies, and configuration
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_PKG = path.join(__dirname, '../package.json');
const BACKEND_PKG = path.join(__dirname, '../backend/package.json');

const WARNINGS = [];
const ERRORS = [];
const INFOS = [];

function validatePackageJson(filePath, context = 'Frontend') {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    INFOS.push(`\n📦 Validating ${context} package.json...`);

    // Check for invalid dependency entries
    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};

    Object.entries(dependencies).forEach(([name, version]) => {
      // Check for command strings in dependencies
      if (version.includes('npx ') || version.includes('tsx ') || version.includes('node ')) {
        ERRORS.push(`${context}: Invalid dependency "${name}" - appears to be a script command: "${version}"`);
      }

      // Check for missing versions
      if (!version || version.trim() === '') {
        ERRORS.push(`${context}: Dependency "${name}" has no version specified`);
      }

      // Warn about overly loose version ranges
      if (version === '*') {
        WARNINGS.push(`${context}: Dependency "${name}" uses wildcard version - may cause instability`);
      }
    });

    // Verify common required dependencies
    const requiredDeps = [
      '@stacks/connect',
      'react',
      'next'
    ];

    if (context === 'Frontend') {
      requiredDeps.forEach(dep => {
        if (!dependencies[dep] && !devDependencies[dep]) {
          WARNINGS.push(`${context}: Missing recommended dependency: "${dep}"`);
        }
      });
    }

    // Check scripts configuration
    const scripts = pkg.scripts || {};
    if (!scripts.verify) {
      INFOS.push(`${context}: No 'verify' script found`);
    }

    INFOS.push(`✅ ${context} package.json validation complete`);
    INFOS.push(`   - Dependencies: ${Object.keys(dependencies).length}`);
    INFOS.push(`   - DevDependencies: ${Object.keys(devDependencies).length}`);

  } catch (error) {
    ERRORS.push(`${context}: Failed to parse package.json: ${error.message}`);
  }
}

function printReport() {
  console.log('\n========================================');
  console.log('📋 Dependency Validation Report');
  console.log('========================================');

  if (INFOS.length > 0) {
    console.log('\nℹ️  Information:');
    INFOS.forEach(msg => console.log(`  ${msg}`));
  }

  if (WARNINGS.length > 0) {
    console.log('\n⚠️  Warnings:');
    WARNINGS.forEach(msg => console.log(`  ${msg}`));
  }

  if (ERRORS.length > 0) {
    console.log('\n❌ Errors:');
    ERRORS.forEach(msg => console.log(`  ${msg}`));
  }

  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('\n✨ All checks passed!');
  }

  console.log('\n========================================\n');

  return ERRORS.length === 0 ? 0 : 1;
}

// Run validation
validatePackageJson(FRONTEND_PKG, 'Frontend');
validatePackageJson(BACKEND_PKG, 'Backend');

process.exit(printReport());
