#!/usr/bin/env node
/**
 * Companion Quality Gate
 * CI script that runs companion tests and enforces deployment rules
 * 
 * RULES:
 * 1. Zero false negatives = DEPLOYMENT BLOCK
 * 2. All P0 tests must pass = DEPLOYMENT BLOCK
 * 3. 95%+ test pass rate required
 * 
 * Usage: node scripts/companion-quality-gate.js
 * Exit codes:
 *   0 = All gates passed
 *   1 = Quality gate failed (deployment blocked)
 */

const { execSync } = require('child_process');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logHeader(message) {
  console.log('\n' + '='.repeat(60));
  log(message, COLORS.bold + COLORS.blue);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.green);
}

function logError(message) {
  log(`✗ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, COLORS.yellow);
}

async function runQualityGate() {
  logHeader('COMPANION QUALITY GATE');
  log('Running safety-critical tests...\n');

  const startTime = Date.now();
  let testOutput = '';
  let exitCode = 0;

  try {
    // Run vitest with JSON reporter to parse results
    testOutput = execSync(
      'npx vitest run --config tests/vitest.config.ts --reporter=verbose 2>&1',
      {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
  } catch (error) {
    testOutput = error.stdout || error.message;
    exitCode = error.status || 1;
  }

  // Parse test results from output
  const passedMatch = testOutput.match(/(\d+) passed/);
  const failedMatch = testOutput.match(/(\d+) failed/);
  const totalPassed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const totalFailed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const totalTests = totalPassed + totalFailed;

  // Check for false negatives (CRITICAL)
  const falseNegativeMatch = testOutput.match(/False Negatives: (\d+)/);
  const falseNegatives = falseNegativeMatch ? parseInt(falseNegativeMatch[1], 10) : 0;

  // Check for deployment blocked
  const deploymentBlocked = testOutput.includes('Deployment Blocked: true');

  // Check for P0 failures
  const p0Failures = (testOutput.match(/P0.*failed/gi) || []).length;

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Report results
  logHeader('QUALITY GATE RESULTS');
  
  console.log(`\nTest Summary:`);
  console.log(`  Total Tests:    ${totalTests}`);
  console.log(`  Passed:         ${totalPassed}`);
  console.log(`  Failed:         ${totalFailed}`);
  console.log(`  Pass Rate:      ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`  Duration:       ${duration}s`);

  console.log(`\nSafety Metrics:`);
  console.log(`  False Negatives: ${falseNegatives}`);
  console.log(`  P0 Failures:     ${p0Failures}`);

  // Evaluate gates
  const gates = [];
  let allPassed = true;

  // Gate 1: Zero false negatives
  if (falseNegatives === 0) {
    gates.push({ name: 'Zero False Negatives', passed: true });
  } else {
    gates.push({ name: 'Zero False Negatives', passed: false, reason: `${falseNegatives} false negative(s) detected` });
    allPassed = false;
  }

  // Gate 2: All P0 tests pass
  if (p0Failures === 0) {
    gates.push({ name: 'P0 Tests Pass', passed: true });
  } else {
    gates.push({ name: 'P0 Tests Pass', passed: false, reason: `${p0Failures} P0 test(s) failed` });
    allPassed = false;
  }

  // Gate 3: 95%+ pass rate
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  if (passRate >= 95) {
    gates.push({ name: '95%+ Pass Rate', passed: true });
  } else {
    gates.push({ name: '95%+ Pass Rate', passed: false, reason: `Pass rate is ${passRate.toFixed(1)}%` });
    allPassed = false;
  }

  // Gate 4: No deployment block from test harness
  if (!deploymentBlocked) {
    gates.push({ name: 'Deployment Not Blocked', passed: true });
  } else {
    gates.push({ name: 'Deployment Not Blocked', passed: false, reason: 'Test harness flagged deployment block' });
    allPassed = false;
  }

  // Print gate results
  console.log(`\nQuality Gates:`);
  for (const gate of gates) {
    if (gate.passed) {
      logSuccess(gate.name);
    } else {
      logError(`${gate.name} - ${gate.reason}`);
    }
  }

  // Final verdict
  logHeader('VERDICT');
  if (allPassed) {
    logSuccess('ALL QUALITY GATES PASSED');
    logSuccess('Deployment is ALLOWED');
    console.log('\n');
    process.exit(0);
  } else {
    logError('QUALITY GATE FAILED');
    logError('Deployment is BLOCKED');
    console.log('\nFix the failing tests before deploying.\n');
    process.exit(1);
  }
}

// Run
runQualityGate().catch((error) => {
  logError(`Quality gate error: ${error.message}`);
  process.exit(1);
});
