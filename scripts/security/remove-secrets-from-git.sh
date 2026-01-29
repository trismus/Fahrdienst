#!/bin/bash
# =============================================================================
# SCRIPT: remove-secrets-from-git.sh
# PURPOSE: Remove .env.local and other secret files from Git history
# =============================================================================
#
# IMPORTANT: This script rewrites Git history. Before running:
# 1. Ensure all team members have pushed their changes
# 2. Create a backup of the repository
# 3. After running, all team members must re-clone the repository
#
# =============================================================================

set -e

echo "=============================================="
echo "  Git History Cleanup - Secrets Removal"
echo "=============================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "ERROR: Not a git repository. Please run from repository root."
    exit 1
fi

# Files to remove from history
FILES_TO_REMOVE=(
    ".env.local"
    ".env"
    ".env.production"
    ".env.development"
    "*.pem"
    "credentials.json"
    "service-account.json"
)

echo "This script will PERMANENTLY remove the following files from Git history:"
echo ""
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "  - $file"
done
echo ""
echo "WARNING: This operation is DESTRUCTIVE and cannot be undone!"
echo "         All team members will need to re-clone the repository."
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Creating backup tag..."
git tag -f backup-before-secrets-cleanup

echo ""
echo "Step 1: Removing files from Git history using git filter-repo..."
echo ""

# Check if git-filter-repo is installed
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (recommended)..."

    # Create paths file for git-filter-repo
    PATHS_FILE=$(mktemp)
    for file in "${FILES_TO_REMOVE[@]}"; do
        echo "glob:$file" >> "$PATHS_FILE"
    done

    git filter-repo --invert-paths --paths-from-file "$PATHS_FILE" --force
    rm "$PATHS_FILE"

elif command -v bfg &> /dev/null; then
    echo "Using BFG Repo-Cleaner..."

    for file in "${FILES_TO_REMOVE[@]}"; do
        bfg --delete-files "$file" --no-blob-protection
    done

    git reflog expire --expire=now --all
    git gc --prune=now --aggressive

else
    echo "WARNING: Neither git-filter-repo nor BFG found."
    echo "Using git filter-branch (slower, legacy method)..."
    echo ""

    # Build the rm command for all files
    RM_COMMANDS=""
    for file in "${FILES_TO_REMOVE[@]}"; do
        RM_COMMANDS="$RM_COMMANDS git rm -rf --cached --ignore-unmatch '$file';"
    done

    git filter-branch --force --index-filter "$RM_COMMANDS" --prune-empty --tag-name-filter cat -- --all

    # Clean up refs
    git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
fi

echo ""
echo "Step 2: Verifying .gitignore..."

GITIGNORE_PATH=".gitignore"
REQUIRED_ENTRIES=(
    ".env"
    ".env*.local"
    "!.env.local.example"
    "*.pem"
    "credentials.json"
    "service-account.json"
)

for entry in "${REQUIRED_ENTRIES[@]}"; do
    if ! grep -qF "$entry" "$GITIGNORE_PATH" 2>/dev/null; then
        echo "Adding '$entry' to .gitignore"
        echo "$entry" >> "$GITIGNORE_PATH"
    fi
done

echo ""
echo "=============================================="
echo "  CLEANUP COMPLETE"
echo "=============================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. FORCE PUSH to remote (this rewrites history):"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. ROTATE ALL SECRETS IMMEDIATELY:"
echo "   - Supabase keys (see rotate-secrets-guide.md)"
echo "   - Google Maps API keys"
echo "   - Any other exposed credentials"
echo ""
echo "3. NOTIFY ALL TEAM MEMBERS:"
echo "   - They must delete their local clone"
echo "   - They must re-clone the repository"
echo "   - DO NOT pull or merge - this will restore the secrets!"
echo ""
echo "4. VERIFY:"
echo "   - Run: git log --all --full-history -- .env.local"
echo "   - Should return no results"
echo ""
