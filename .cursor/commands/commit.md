---
description: with any codebase that has any .next directory
alwaysApply: false
---
# Assistant persona & coding rules (kept as guidance for the Cursor rule)
# You are a Senior Front-End Developer and an Expert in ReactJS, NextJS, JavaScript, TypeScript, HTML, CSS and modern UI/UX frameworks.
# Follow the user's requirements carefully & to the letter.
# First think step-by-step - describe plan, then confirm, then write code.
# (Persona and code guidelines included for clarity — this file implements the git automation requested.)

rules:
  - name: "Smart Git Commit (emoji + type prefix)"
    trigger: "/commit"
    description: "Stage changes by feature/area and create separate commits for each logical group."
    actions:
      - type: "shell"
        command: |
          #!/usr/bin/env bash
          set -euo pipefail

          # Helper: print to stderr
          err() { printf "%s\n" "$*" >&2; }

          # Helper: detect commit type and emoji for a group of files
          detect_type_emoji() {
            local files="$1"
            local diff_content="$2"
            local type="chore"
            local emoji="🧩"
            
            # tests
            if printf "%s\n" "$files" | grep -Ei "test|spec|__tests__|\\.spec\\.|\\.test\\." >/dev/null 2>&1 || printf "%s\n" "$diff_content" | grep -Ei "assert|describe\\(|it\\(|jest|mocha" >/dev/null 2>&1; then
              type="test"
              emoji="🧪"
            # docs
            elif printf "%s\n" "$files" | grep -Ei "readme|docs|\\.md$|\\.rst$" >/dev/null 2>&1 || printf "%s\n" "$diff_content" | grep -Ei "documentation|docstring|README" >/dev/null 2>&1; then
              type="docs"
              emoji="📝"
            # style / css / ui
            elif printf "%s\n" "$files" | grep -Ei "\\.css$|\\.scss$|\\.sass$|\\.less$|tailwind|\\.html$|\\.tsx?$|components" >/dev/null 2>&1 && printf "%s\n" "$diff_content" | grep -Ei "className|tailwind|padding|margin|color|background" >/dev/null 2>&1; then
              type="style"
              emoji="💄"
            # refactor
            elif printf "%s\n" "$diff_content" | grep -Ei "refactor|rename|move|restructure" >/dev/null 2>&1; then
              type="refactor"
              emoji="♻️"
            # feature / add
            elif printf "%s\n" "$files" | grep -Ei "add|new|feature|\\.feature\\.|routes|pages|app" >/dev/null 2>&1 || printf "%s\n" "$diff_content" | grep -Ei "new component|add feature|create" >/dev/null 2>&1; then
              type="feature"
              emoji="✨"
            # fix / bug
            elif printf "%s\n" "$diff_content" | grep -Ei "fix|bug|error|exception|throw|undefined|null|crash|panic|segfault" >/dev/null 2>&1 || printf "%s\n" "$files" | grep -Ei "fix|bug|patch" >/dev/null 2>&1; then
              type="fix"
              emoji="🐛"
            # config files
            elif printf "%s\n" "$files" | grep -Ei "package\\.json|tsconfig|eslint|prettier|\.config\\.|\.env|Dockerfile|docker-compose" >/dev/null 2>&1; then
              type="chore"
              emoji="🔧"
            fi
            
            printf "%s|%s" "$type" "$emoji"
          }

          # Helper: generate message for a group
          generate_message() {
            local type="$1"
            local basename="$2"
            local verb="Update"
            
            case "$type" in
              feature) verb="Add" ;;
              fix) verb="Fix" ;;
              docs) verb="Update" ;;
              style) verb="Style" ;;
              refactor) verb="Refactor" ;;
              test) verb="Add/Update tests for" ;;
              *) verb="Update" ;;
            esac
            
            printf "%s %s" "$verb" "$basename"
          }

          # 1) Ensure we are inside a git repo
          if ! git rev-parse --git-dir >/dev/null 2>&1; then
            err "✖ Not a git repository. Aborting."
            exit 2
          fi

          # 2) Get all changed files (unstaged + staged)
          ALL_CHANGED=$(git status --porcelain | awk '{print $2}' || true)
          if [ -z "$ALL_CHANGED" ]; then
            echo "ℹ No changes to commit."
            exit 0
          fi

          # 3) Group files by logical feature areas
          # Create temporary directory for grouping
          TEMP_DIR=$(mktemp -d)
          trap 'rm -rf "$TEMP_DIR"' EXIT

          echo "📦 Analyzing changes and grouping by feature..."
          echo

          # Group files by their primary directory or type
          declare -A GROUPS
          while IFS= read -r file; do
            [ -z "$file" ] && continue
            
            # Determine group key based on file path
            GROUP_KEY=""
            
            # API routes
            if printf "%s" "$file" | grep -q "api/"; then
              API_NAME=$(printf "%s" "$file" | sed -E 's|.*/api/([^/]+).*|\1|')
              GROUP_KEY="api:$API_NAME"
            # Components
            elif printf "%s" "$file" | grep -q "components/"; then
              COMP_NAME=$(basename "$file" | sed -E 's/\.(jsx?|tsx?)$//')
              GROUP_KEY="component:$COMP_NAME"
            # Hooks
            elif printf "%s" "$file" | grep -q "hooks/"; then
              HOOK_NAME=$(basename "$file" | sed -E 's/\.(jsx?|tsx?)$//')
              GROUP_KEY="hook:$HOOK_NAME"
            # Pages/Routes
            elif printf "%s" "$file" | grep -Eq "pages/|app/.*page\."; then
              PAGE_DIR=$(dirname "$file")
              GROUP_KEY="page:$(basename "$PAGE_DIR")"
            # Tests
            elif printf "%s" "$file" | grep -Eq "test|spec|__tests__"; then
              GROUP_KEY="tests"
            # Docs
            elif printf "%s" "$file" | grep -Eq "\\.md$|docs/"; then
              GROUP_KEY="docs"
            # Config files
            elif printf "%s" "$file" | grep -Eq "package\\.json|config\\.|tsconfig|eslint|prettier|\\.env"; then
              GROUP_KEY="config"
            # Styles
            elif printf "%s" "$file" | grep -Eq "\\.css$|\\.scss$|\\.sass$"; then
              STYLE_NAME=$(basename "$file" | sed -E 's/\.(css|scss|sass)$//')
              GROUP_KEY="style:$STYLE_NAME"
            # Lib/Utils
            elif printf "%s" "$file" | grep -Eq "lib/|utils/"; then
              LIB_NAME=$(basename "$file" | sed -E 's/\.(jsx?|tsx?)$//')
              GROUP_KEY="lib:$LIB_NAME"
            # Fallback: use first directory in path
            else
              FIRST_DIR=$(printf "%s" "$file" | cut -d'/' -f1)
              GROUP_KEY="other:$FIRST_DIR"
            fi
            
            # Add file to group
            if [ -z "${GROUPS[$GROUP_KEY]+x}" ]; then
              GROUPS[$GROUP_KEY]="$file"
            else
              GROUPS[$GROUP_KEY]="${GROUPS[$GROUP_KEY]}"$'\n'"$file"
            fi
          done <<< "$ALL_CHANGED"

          # 4) Process each group
          COMMIT_COUNT=0
          for GROUP_KEY in "${!GROUPS[@]}"; do
            GROUP_FILES="${GROUPS[$GROUP_KEY]}"
            FILE_COUNT=$(printf "%s\n" "$GROUP_FILES" | wc -l | tr -d ' ')
            
            # Get nice group name
            GROUP_TYPE=$(printf "%s" "$GROUP_KEY" | cut -d':' -f1)
            GROUP_NAME=$(printf "%s" "$GROUP_KEY" | cut -d':' -f2-)
            
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📂 Group: $GROUP_TYPE → $GROUP_NAME ($FILE_COUNT file(s))"
            printf "%s\n" "$GROUP_FILES" | sed 's/^/   • /'
            echo
            
            # Stage these files
            while IFS= read -r file; do
              [ -z "$file" ] && continue
              git add "$file" 2>/dev/null || true
            done <<< "$GROUP_FILES"
            
            # Get diff for detection
            DIFF_CONTENT=$(git diff --cached -U0 -- $GROUP_FILES 2>/dev/null || true)
            
            # Detect type and emoji
            TYPE_EMOJI=$(detect_type_emoji "$GROUP_FILES" "$DIFF_CONTENT")
            TYPE=$(printf "%s" "$TYPE_EMOJI" | cut -d'|' -f1)
            EMOJI=$(printf "%s" "$TYPE_EMOJI" | cut -d'|' -f2)
            
            # Determine description
            FIRST_FILE=$(printf "%s\n" "$GROUP_FILES" | head -n1)
            FIRST_BASENAME=$(basename "$FIRST_FILE")
            
            # Auto-generate message based on group
            case "$GROUP_TYPE" in
              api) MSG="Update $GROUP_NAME API" ;;
              component) MSG="Update $GROUP_NAME component" ;;
              hook) MSG="Update $GROUP_NAME hook" ;;
              page) MSG="Update $GROUP_NAME page" ;;
              tests) MSG="Update tests" ;;
              docs) MSG="Update documentation" ;;
              config) MSG="Update configuration" ;;
              style) MSG="Style updates for $GROUP_NAME" ;;
              lib) MSG="Update $GROUP_NAME utilities" ;;
              *) MSG=$(generate_message "$TYPE" "$GROUP_NAME") ;;
            esac
            
            # Prompt for custom message or confirm auto-generated
            printf "💬 Commit message (Enter to use: '$MSG'): "
            IFS= read -r USER_MSG || true
            if [ -n "$USER_MSG" ]; then
              MSG="$USER_MSG"
            fi
            
            # Create commit
            SINGLE_LINE_MSG=$(printf "%s" "$MSG" | tr '\n' ' ' | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')
            COMMIT_MESSAGE="${EMOJI} ${TYPE}: ${SINGLE_LINE_MSG}"
            
            if git commit -m "$COMMIT_MESSAGE" >/dev/null 2>&1; then
              echo "✅ Committed: $COMMIT_MESSAGE"
              COMMIT_COUNT=$((COMMIT_COUNT + 1))
            else
              err "⚠️  Failed to commit this group (may be no staged changes)"
            fi
            
            echo
          done

          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "✨ Done! Created $COMMIT_COUNT commit(s)."
          exit 0