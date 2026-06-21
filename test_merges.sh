#!/bin/bash
BRANCHES=$(git branch -r --no-merged main | grep -v "master" | grep -v "backup")
SUCCESS=()
CONFLICTS=()

for b in $BRANCHES; do
  echo "Trying to merge $b..."
  git merge --no-commit --no-ff $b
  if [ $? -eq 0 ]; then
    SUCCESS+=($b)
    git commit -m "Merge $b"
  else
    CONFLICTS+=($b)
    git merge --abort
  fi
done

echo ""
echo "=== SUCCESSFUL MERGES ==="
printf '%s\n' "${SUCCESS[@]}"
echo "=== CONFLICTS ==="
printf '%s\n' "${CONFLICTS[@]}"
