#!/usr/bin/env node

/**
 * Auto-sync from GitHub
 * Runs periodically to pull latest changes from GitHub origin/main
 * Handles conflicts by taking GitHub version and notifying you
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOG_FILE = path.join(__dirname, '../.git/auto-sync.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  console.log(logMsg);
  fs.appendFileSync(LOG_FILE, logMsg, 'utf8');
}

function gitCommand(cmd) {
  try {
    const result = execSync(cmd, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function syncFromGithub() {
  log('🔄 Checking for GitHub updates...');

  // Fetch latest
  const fetchResult = gitCommand('git fetch origin main');
  if (!fetchResult.success) {
    log(`❌ Fetch failed: ${fetchResult.error}`);
    return;
  }

  // Check if we're behind
  const behindResult = gitCommand('git rev-list --count main..origin/main');
  if (!behindResult.success || behindResult.output === '0') {
    log('✅ Already up to date with GitHub');
    return;
  }

  const commitsBehind = behindResult.output;
  log(`📥 Found ${commitsBehind} new commit(s) from GitHub`);

  // Pull with rebase (prefer GitHub changes)
  const pullResult = gitCommand('git pull origin main --rebase --autostash');
  
  if (pullResult.success) {
    log(`✅ Successfully synced from GitHub! (${commitsBehind} commit(s) pulled)`);
    log('🔄 Changes now live in Replit');
  } else if (pullResult.error.includes('conflict')) {
    log('⚠️  Merge conflict detected');
    // Resolve by taking GitHub version
    gitCommand('git checkout --theirs .');
    gitCommand('git add -A');
    gitCommand('git commit -m "Auto-sync: resolved GitHub changes"');
    log('✅ Conflict resolved (GitHub version kept)');
  } else {
    log(`❌ Sync failed: ${pullResult.error}`);
  }
}

// Run immediately first
syncFromGithub();

// Then run periodically
setInterval(syncFromGithub, SYNC_INTERVAL);

log(`🚀 Auto-sync started (checking every ${SYNC_INTERVAL / 1000 / 60} minutes)`);
log('Press Ctrl+C to stop');
