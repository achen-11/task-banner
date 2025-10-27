#!/usr/bin/env node
/**
 * Post-build script: Organize build files into correct directories
 *
 * This script runs after Vite build to:
 * 1. Clean old build artifacts from target directories
 * 2. Move index.html to page/ directory
 * 3. Move JS files to js/ directory
 * 4. Move CSS files to css/ directory
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '../src')
const PAGE_DIR = path.join(ROOT_DIR, 'page')
const JS_DIR = path.join(ROOT_DIR, 'js')
const CSS_DIR = path.join(ROOT_DIR, 'css')

console.log('\n🚀 Post-build: Organizing files...\n')

/**
 * Delete old build files in a directory
 * @param {string} dir - Directory to clean
 * @param {string} pattern - File pattern to match (e.g., '.js', '.css')
 */
function cleanOldFiles(dir, pattern) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${path.relative(ROOT_DIR, dir)}`)
    return
  }

  const files = fs.readdirSync(dir)
  let deletedCount = 0

  files.forEach(file => {
    if (file.endsWith(pattern) && file.includes('-')) {
      // Only delete files with hash patterns (e.g., index-abc123.js)
      const filePath = path.join(dir, file)
      fs.unlinkSync(filePath)
      deletedCount++
      console.log(`🗑️  Deleted old file: ${file}`)
    }
  })

  if (deletedCount === 0) {
    console.log(`✓ No old ${pattern} files to clean in ${path.relative(ROOT_DIR, dir)}`)
  }
}

/**
 * Move files from source to destination
 * @param {string} pattern - File extension pattern (e.g., '.js', '.css')
 * @param {string} destDir - Destination directory
 */
function moveFiles(pattern, destDir) {
  const files = fs.readdirSync(ROOT_DIR)
  let movedCount = 0

  files.forEach(file => {
    if (file.endsWith(pattern) && file !== 'vite.config.ts') {
      const srcPath = path.join(ROOT_DIR, file)
      const destPath = path.join(destDir, file)

      // Only move if it's a file (not directory)
      if (fs.statSync(srcPath).isFile()) {
        fs.renameSync(srcPath, destPath)
        movedCount++
        console.log(`📦 Moved: ${file} → ${path.relative(ROOT_DIR, destDir)}/`)
      }
    }
  })

  if (movedCount === 0) {
    console.log(`⚠️  No ${pattern} files to move`)
  }
}

/**
 * Move index.html to page directory
 */
function moveIndexHtml() {
  const srcPath = path.join(ROOT_DIR, 'index.html')
  const destPath = path.join(PAGE_DIR, 'index.html')

  if (fs.existsSync(srcPath)) {
    // Ensure page directory exists
    if (!fs.existsSync(PAGE_DIR)) {
      fs.mkdirSync(PAGE_DIR, { recursive: true })
    }

    fs.renameSync(srcPath, destPath)
    console.log(`📄 Moved: index.html → page/`)
  } else {
    console.log(`⚠️  index.html not found in ${ROOT_DIR}`)
  }
}

// Main execution
try {
  console.log('1️⃣  Cleaning old JS files...')
  cleanOldFiles(JS_DIR, '.js')

  console.log('\n2️⃣  Cleaning old CSS files...')
  cleanOldFiles(CSS_DIR, '.css')

  console.log('\n3️⃣  Moving JS files...')
  moveFiles('.js', JS_DIR)

  console.log('\n4️⃣  Moving CSS files...')
  moveFiles('.css', CSS_DIR)

  console.log('\n5️⃣  Moving index.html...')
  moveIndexHtml()

  console.log('\n✅ Post-build completed successfully!\n')
} catch (error) {
  console.error('\n❌ Post-build failed:', error.message)
  process.exit(1)
}
