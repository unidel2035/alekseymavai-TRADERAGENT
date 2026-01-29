#!/usr/bin/env python3
"""
Pine Script v6 Compliance Verification Script

This script checks Pine Script files for common v6 compatibility issues:
1. Version directive is set to v6
2. No plotshape/plot/plotchar calls inside 'if' statements at global scope
3. Proper use of color.new() instead of deprecated transp parameter
"""

import re
import sys
from pathlib import Path

def check_pine_v6_compliance(file_path):
    """Check a Pine Script file for v6 compliance."""
    errors = []
    warnings = []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.split('\n')

    # Check 1: Version directive
    version_match = re.search(r'//@version=(\d+)', content)
    if not version_match:
        errors.append("No version directive found")
    elif version_match.group(1) != '6':
        warnings.append(f"Using Pine Script v{version_match.group(1)} instead of v6")

    # Check 2: Look for plotshape/plot/plotchar inside if blocks
    # This is a simplified check - looks for 'if' followed by 'plot' function
    in_if_block = False
    if_indent = 0

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Detect 'if' statement start
        if stripped.startswith('if ') and not stripped.startswith('if not na('):
            in_if_block = True
            if_indent = len(line) - len(line.lstrip())

        # Check for plot functions inside if block
        if in_if_block:
            current_indent = len(line) - len(line.lstrip())

            # Exit if block when indent decreases
            if current_indent <= if_indent and stripped and not stripped.startswith('//'):
                in_if_block = False

            # Check for plot functions
            if any(func in stripped for func in ['plotshape(', 'plot(', 'plotchar(', 'plotcandle(', 'plotarrow(']):
                errors.append(f"Line {i}: Plot function found inside 'if' block - not allowed in v6 global scope")

    # Check 3: Look for deprecated 'transp' parameter
    if 'transp=' in content:
        warnings.append("Found 'transp=' parameter - consider using color.new() instead")

    return errors, warnings

def main():
    """Main verification function."""
    print("=" * 70)
    print("Pine Script v6 Compliance Verification")
    print("=" * 70)
    print()

    # Find all .pine files
    pine_files = list(Path('.').rglob('*.pine'))

    if not pine_files:
        print("❌ No Pine Script files found!")
        return 1

    total_errors = 0
    total_warnings = 0

    for pine_file in sorted(pine_files):
        print(f"📄 Checking: {pine_file}")
        errors, warnings = check_pine_v6_compliance(pine_file)

        if errors:
            print(f"  ❌ Errors ({len(errors)}):")
            for error in errors:
                print(f"     - {error}")
            total_errors += len(errors)

        if warnings:
            print(f"  ⚠️  Warnings ({len(warnings)}):")
            for warning in warnings:
                print(f"     - {warning}")
            total_warnings += len(warnings)

        if not errors and not warnings:
            print("  ✅ No issues found")

        print()

    print("=" * 70)
    print(f"Summary: {len(pine_files)} files checked")
    print(f"  ✅ Errors: {total_errors}")
    print(f"  ⚠️  Warnings: {total_warnings}")
    print("=" * 70)

    return 1 if total_errors > 0 else 0

if __name__ == '__main__':
    sys.exit(main())
