#!/bin/bash

# Script to find and report remaining 'any' type usage

echo "🔍 Scanning for 'any' type usage in src/ directory..."
echo ""

# Count total occurrences
TOTAL=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l | tr -d ' ')

echo "📊 Total 'any' occurrences found: $TOTAL"
echo ""

# Group by file
echo "📁 Files with 'any' types:"
grep -r ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules" | grep -v ".next" | cut -d: -f1 | sort | uniq -c | sort -rn

echo ""
echo "✅ Run 'npm run lint' to see ESLint errors"
echo "✅ Fix remaining any types to improve type safety"
