#!/bin/bash

set -e

# Frontend build → copy dist to Kooboo src/page|js|css, tracked by .build-manifest.json
# Usage:
#   bash build.sh          # build only
#   bash build.sh --push   # build + kb push manifest files

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$PROJECT_DIR/frontend"
MANIFEST_FILE="$PROJECT_DIR/.build-manifest.json"
PUSH_TO_KOOBOO=false

if [ "$1" = "--push" ]; then
  PUSH_TO_KOOBOO=true
fi

cd "$FRONTEND_DIR"

echo "Cleaning previous build artifacts from src..."

clean_manifest_files() {
  local key="$1"
  local subdir="$2"
  local files
  files=$(node -e "const m=require('$MANIFEST_FILE'); console.log((m.$key || []).join(' '))" 2>/dev/null || true)
  if [ -n "$files" ]; then
    for file in $files; do
      [ -n "$file" ] && rm -f "$PROJECT_DIR/src/$subdir/$file" && echo "  Removed: src/$subdir/$file"
    done
  fi
}

if [ -f "$MANIFEST_FILE" ]; then
  if command -v node &> /dev/null; then
    clean_manifest_files page page
    clean_manifest_files js js
    clean_manifest_files css css
  fi
else
  echo "  No manifest found, removing legacy hash artifacts..."
  for file in "$PROJECT_DIR"/src/js/*-*.js; do
    [ -f "$file" ] && rm -f "$file" && echo "  Removed: src/js/$(basename "$file")"
  done
  for file in "$PROJECT_DIR"/src/css/*-*.css; do
    [ -f "$file" ] && rm -f "$file" && echo "  Removed: src/css/$(basename "$file")"
  done
fi

echo "Building frontend..."
pnpm build

echo "Copying files to Kooboo directories..."

mkdir -p "$PROJECT_DIR/src/page"
mkdir -p "$PROJECT_DIR/src/js"
mkdir -p "$PROJECT_DIR/src/css"

new_pages=""
new_js=""
new_css=""

if [ -f "dist/index.html" ]; then
  cp dist/index.html "$PROJECT_DIR/src/page/"
  new_pages="\"index.html\""
  echo "  Copied: src/page/index.html"
fi

for file in dist/*.js; do
  if [ -f "$file" ]; then
    basename_file=$(basename "$file")
    cp "$file" "$PROJECT_DIR/src/js/"
    [ -n "$new_js" ] && new_js="$new_js, "
    new_js="$new_js\"$basename_file\""
    echo "  Copied: src/js/$basename_file"
  fi
done

for file in dist/*.css; do
  if [ -f "$file" ]; then
    basename_file=$(basename "$file")
    cp "$file" "$PROJECT_DIR/src/css/"
    [ -n "$new_css" ] && new_css="$new_css, "
    new_css="$new_css\"$basename_file\""
    echo "  Copied: src/css/$basename_file"
  fi
done

cat > "$MANIFEST_FILE" << EOF
{
  "page": [$new_pages],
  "js": [$new_js],
  "css": [$new_css]
}
EOF

echo ""
echo "Build complete!"
echo ""
echo "Output files:"
echo "  - src/page/index.html"
echo "  - src/js/*.js"
echo "  - src/css/*.css"
echo ""
echo "Manifest saved to: $MANIFEST_FILE"

if [ "$PUSH_TO_KOOBOO" = true ]; then
  cd "$PROJECT_DIR"
  echo ""
  echo "Pushing to Kooboo..."
  kb push src/page/index.html

  push_js=$(node -e "const m=require('$MANIFEST_FILE'); console.log(m.js.join(' '))" 2>/dev/null || true)
  if [ -n "$push_js" ]; then
    for file in $push_js; do
      [ -n "$file" ] && echo "  Pushing src/js/$file" && kb push "src/js/$file"
    done
  fi

  push_css=$(node -e "const m=require('$MANIFEST_FILE'); console.log(m.css.join(' '))" 2>/dev/null || true)
  if [ -n "$push_css" ]; then
    for file in $push_css; do
      [ -n "$file" ] && echo "  Pushing src/css/$file" && kb push "src/css/$file"
    done
  fi

  echo "Push complete!"
fi
