#!/bin/bash
# dependency-checker.sh
# Script to verify and report on unmet peer dependencies

echo "========================================"
echo "PassportX Dependency Health Check"
echo "========================================"
echo ""

echo "1. Checking npm dependency tree..."
npm ls --depth=0 2>&1 | grep -i "unmet"

echo ""
echo "2. Running full dependency list..."
npm ls --depth=0

echo ""
echo "3. Checking for peer dependency warnings..."
npm ls 2>&1 | grep -i "peer"

echo ""
echo "4. Checking for missing packages..."
npm ls 2>&1 | grep -i "missing"

echo ""
echo "========================================"
echo "Dependency check complete!"
echo "========================================"
