#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════════
// CANONICAL GOVERNANCE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════
// This script FAILS LOUDLY if the Pet Crisis Companion engine
// violates canonical behavioral law.

const fs = require('fs');
const path = require('path');

// CANONICAL PRIORITY ORDER (Section 2)
const CANONICAL_PRIORITY = [
  'suicide_intent',
  'suicide_active', 
  'suicide_passive',
  'dv_coercive_control',
  'mdd',
  'paralysis',
  'neurodivergent',
  'death_traumatic',
  'death_euthanasia',
  'death_general',
  'death_found_deceased',
  'anticipatory',
  'emergency',
  'scam',
  'found_pet',
  'lost_pet',
  'guilt_cbt',
  'disenfranchised',
  'pediatric',
  'quality_of_life',
  'general'
];

// REQUIRED SUICIDE TRIAGE COMPONENTS
const REQUIRED_NEGATION_REGEX = /\b(don't|do not|never|won't|doesn't|didn't)\s+(\w+\s+){0,3}(want to die|kill myself|end it|hurt myself)/i;
const REQUIRED_ATTRIBUTION_PATTERNS = [
  /["']([^"']*(?:want to die|kill myself|end it|hurt myself)[^"']*)["']/i,
  /\b(he|she|they|said|told me|my friend|someone)\s+(wants to|wants|is going to|is trying to)\s+(die|kill|end it)/i
];

function extractObjectLiteral(source, exportName) {
  const exportNeedle = `export const ${exportName}`;
  const exportIndex = source.indexOf(exportNeedle);
  if (exportIndex === -1) return null;

  const braceStart = source.indexOf('{', exportIndex);
  if (braceStart === -1) return null;

  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  return null;
}

function extractBlockStartingAt(source, braceStartIndex) {
  if (braceStartIndex < 0 || braceStartIndex >= source.length) return null;
  if (source[braceStartIndex] !== '{') return null;

  let depth = 0;
  for (let i = braceStartIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStartIndex, i + 1);
      }
    }
  }
  return null;
}

function extractFunctionBody(source, functionName) {
  const needle = `export function ${functionName}`;
  const start = source.indexOf(needle);
  if (start === -1) return null;

  const braceStart = source.indexOf('{', start);
  if (braceStart === -1) return null;

  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart, i + 1);
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// GOVERNANCE CHECKS
// ═══════════════════════════════════════════════════════════════════

class GovernanceChecker {
  constructor() {
    this.failures = [];
    this.warnings = [];
  }

  fail(message) {
    this.failures.push(`❌ FAIL: ${message}`);
    console.error(`❌ FAIL: ${message}`);
  }

  warn(message) {
    this.warnings.push(`⚠️  WARN: ${message}`);
    console.warn(`⚠️  WARN: ${message}`);
  }

  pass(message) {
    console.log(`✅ PASS: ${message}`);
  }

  // 1) PRIORITY ORDER ENFORCEMENT
  checkPriorityOrder(engineContent) {
    console.log('\n🔍 CHECKING PRIORITY ORDER...');
    
    // Extract category assignments from if/else blocks
    const categoryMatches = engineContent.match(/category:\s*['"]([^'"]+)['"]/g);
    if (!categoryMatches) {
      this.fail('No category assignments found in engine');
      return;
    }

    const extractedOrder = categoryMatches.map(match => {
      const category = match.match(/category:\s*['"]([^'"]+)['"]/)[1];
      // Map suicide_* to canonical order
      if (category.startsWith('suicide_')) return category;
      return category;
    });

    // Remove duplicates while preserving order
    const uniqueOrder = [...new Set(extractedOrder)];
    
    // Compare with canonical priority
    const canonicalStr = CANONICAL_PRIORITY.join(',');
    const actualStr = uniqueOrder.join(',');
    
    if (canonicalStr !== actualStr) {
      this.fail('PRIORITY ORDER VIOLATION');
      console.error('\n📊 EXPECTED ORDER:');
      CANONICAL_PRIORITY.forEach((cat, i) => {
        console.error(`  ${i + 1}. ${cat}`);
      });
      console.error('\n📊 ACTUAL ORDER:');
      uniqueOrder.forEach((cat, i) => {
        const status = cat === CANONICAL_PRIORITY[i] ? '✅' : '❌';
        console.error(`  ${i + 1}. ${cat} ${status}`);
      });
      console.error('\n🔧 FIX: Reorder if/else blocks to match canonical priority');
    } else {
      this.pass('Priority order matches canonical specification');
    }
  }

  // 2) SUICIDE TRIAGE SAFETY CHECKS
  checkSuicideTriageSafety(engineContent) {
    console.log('\n🔍 CHECKING SUICIDE TRIAGE SAFETY...');
    
    // Check negation regex (string match to avoid regex parsing edge-cases)
    const requiredNegationLiteral = "const negationPattern = /\\b(don't|do not|never|won't|doesn't|didn't)\\s+(\\w+\\s+){0,3}(want to die|kill myself|end it|hurt myself)/i";
    if (!engineContent.includes(requiredNegationLiteral)) {
      this.fail('SUICIDE NEGATION GUARD MISSING');
      console.error('🔧 FIX: Add negation regex pattern to analyzeSuicideRisk function');
      console.error('   Pattern: /\\b(don\'t|do not|never|won\'t|doesn\'t|didn\'t)\\s+(\\w+\\s+){0,3}(want to die|kill myself|end it|hurt myself)/i');
    } else {
      this.pass('Suicide negation guard present');
    }

    // Check attribution guards
    let attributionFound = false;
    for (const pattern of REQUIRED_ATTRIBUTION_PATTERNS) {
      if (pattern.test(engineContent)) {
        attributionFound = true;
        break;
      }
    }
    if (!attributionFound) {
      this.fail('SUICIDE ATTRIBUTION GUARD MISSING');
      console.error('🔧 FIX: Add attribution pattern checks for quoted speech and someone else\'s statements');
    } else {
      this.pass('Suicide attribution guard present');
    }

    // Check that suicide triage is present and ordered first.
    // Avoid parsing braces inside regex literals by using index ordering in the full file.
    const genIdx = engineContent.indexOf('export function generateCompanionResponse');
    if (genIdx === -1) {
      this.fail('generateCompanionResponse not found');
      return;
    }

    const triageNeedle = 'const suicideRisk = analyzeSuicideRisk(userInput);';
    const triageIdx = engineContent.indexOf(triageNeedle, genIdx);
    if (triageIdx === -1) {
      this.fail('SUICIDE TRIAGE NOT PRESENT');
      console.error(`🔧 FIX: generateCompanionResponse must include: ${triageNeedle}`);
      return;
    }

    const firstOtherNeedles = [
      'const dv = detectDvCoerciveControl(userInput);',
      'const mdd = detectMDD(userInput);',
      'const paralysis = detectGriefParalysis(userInput);',
      'const neuro = detectNeurodivergent(userInput);',
      'const death = detectDeathGrief(userInput);'
    ];

    const otherIdxs = firstOtherNeedles
      .map(n => engineContent.indexOf(n, genIdx))
      .filter(i => i !== -1);

    const firstOtherIdx = otherIdxs.length > 0 ? Math.min(...otherIdxs) : -1;
    if (firstOtherIdx !== -1 && triageIdx > firstOtherIdx) {
      this.fail('SUICIDE TRIAGE NOT FIRST');
      console.error('🔧 FIX: Ensure suicide triage precedes all other routing logic');
      return;
    }

    this.pass('Suicide triage precedes all other logic');
  }

  // 3) RESPONSE TEMPLATE CONTRACT
  checkResponseTemplateContract(engineContent) {
    console.log('\n🔍 CHECKING RESPONSE TEMPLATE CONTRACT...');
    
    // Extract RESPONSE_TEMPLATES object literal (brace-matched)
    const templatesLiteral = extractObjectLiteral(engineContent, 'RESPONSE_TEMPLATES');
    if (!templatesLiteral) {
      this.fail('RESPONSE_TEMPLATES not found');
      return;
    }

    // Parse template categories (top-level keys)
    const templateCategories = [];
    const keyRegex = /\n\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{/g;
    let keyMatch;
    while ((keyMatch = keyRegex.exec(templatesLiteral)) !== null) {
      templateCategories.push(keyMatch[1]);
    }

    // Extract routing categories
    const routingCategories = [];
    const routingMatches = engineContent.match(/category:\s*['"]([^'"]+)['"]/g);
    if (routingMatches) {
      for (const match of routingMatches) {
        const category = match.match(/category:\s*['"]([^'"]+)['"]/)[1];
        if (!routingCategories.includes(category)) {
          routingCategories.push(category);
        }
      }
    }

    // Check for missing templates
    for (const category of routingCategories) {
      if (!templateCategories.includes(category)) {
        this.fail(`MISSING TEMPLATE: Category '${category}' exists in routing but not in RESPONSE_TEMPLATES`);
      }
    }

    // Check for unused templates
    for (const template of templateCategories) {
      if (!routingCategories.includes(template)) {
        this.fail(`UNUSED TEMPLATE: Category '${template}' exists in RESPONSE_TEMPLATES but not in routing`);
      }
    }

    // Check for inline response strings INSIDE generateCompanionResponse (template response fields are allowed)
    const body = extractFunctionBody(engineContent, 'generateCompanionResponse');
    if (!body) {
      this.fail('generateCompanionResponse not found');
      return;
    }
    const inlineResponses = body.match(/\bresponse:\s*["'][^"']+["']/g);
    if (inlineResponses && inlineResponses.length > 0) {
      this.fail('INLINE RESPONSE STRINGS DETECTED');
      console.error('🔧 FIX: Use RESPONSE_TEMPLATES[category].response in generateCompanionResponse');
      console.error('   Found:', inlineResponses.slice(0, 3).join(', '));
    }

    if (this.failures.filter(f => f.includes('TEMPLATE')).length === 0) {
      this.pass('Response template contract satisfied');
    }
  }

  // 4) TEST COVERAGE GUARANTEE
  checkTestCoverage() {
    console.log('\n🔍 CHECKING TEST COVERAGE...');
    
    const testFile = fs.readFileSync('__tests__/counselor-engine.test.ts', 'utf8');

    // Count tests per category in a way that matches Jest runtime behavior.
    // Strategy:
    // - Each distinct `it(...)` is 1 test.
    // - When an `analysis.category).toBe('<cat>')` assertion appears inside `<arr>.forEach(...)`,
    //   the runtime number of tests is the number of elements in `<arr>`.
    const categoryTestCounts = {};
    for (const category of CANONICAL_PRIORITY) categoryTestCounts[category] = 0;

    // 1) Baseline: count direct it() blocks asserting category (covers non-loop tests)
    for (const category of CANONICAL_PRIORITY) {
      const directItRe = new RegExp(
        `it\\([\\s\\S]*?\\)\\s*=>\\s*\\{[\\s\\S]*?analysis\\.category\\)\\.toBe\\(['\"]${category}['\"]\\)`
      , 'g');
      categoryTestCounts[category] += (testFile.match(directItRe) || []).length;
    }

    // 2) Build array length table (quoted string elements only)
    const arrays = new Map();
    const arrayDeclRe = /const\s+(\w+)\s*=\s*\[((?:[^[\]]|\[[^\]]*\])*)\];/gs;
    let arrayMatch;
    while ((arrayMatch = arrayDeclRe.exec(testFile)) !== null) {
      const name = arrayMatch[1];
      const body = arrayMatch[2];
      const itemCount = body
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('"') || l.startsWith("'"))
        .length;
      if (itemCount > 0) arrays.set(name, itemCount);
    }

    // 3) For each category assertion, if it occurs in an `<arr>.forEach` block, count as arr length.
    // Supports assertions written as:
    //   expect(result.analysis.category).toBe('x')
    //   expect(analysis.category).toBe('x')
    // We search backwards from each assertion to find the nearest forEach.
    for (const category of CANONICAL_PRIORITY) {
      const toBeRe = new RegExp(`(?:\\bresult\\.)?analysis\\.category\\)\\.toBe\\(['\"]${category}['\"]\\)`, 'g');
      let match;
      while ((match = toBeRe.exec(testFile)) !== null) {
        const hit = match.index;

        // Search backwards for the nearest forEach that contains this assertion
        const before = testFile.slice(0, hit);
        const forEachMatches = [...before.matchAll(/(\w+)\.forEach\(\s*\w+\s*=>\s*\{/g)];
        if (forEachMatches.length > 0) {
          const lastMatch = forEachMatches[forEachMatches.length - 1];
          const arrName = lastMatch[1];
          const count = arrays.get(arrName);
          if (typeof count === 'number') {
            categoryTestCounts[category] = Math.max(categoryTestCounts[category], count);
          }
        }
      }
    }

    // Check minimum test requirements
    for (const category of CANONICAL_PRIORITY) {
      if (category === 'general') continue; // Skip fallback category
      
      const testCount = categoryTestCounts[category] || 0;
      if (testCount < 2) {
        this.fail(`INSUFFICIENT TESTS: Category '${category}' has only ${testCount} tests (minimum: 2)`);
      }
    }

    // Check for specific required tests
    if (!testFile.includes('Red Team: Suicide Negation Guard')) {
      this.fail('MISSING SUICIDE GUARD TESTS: Red Team suicide negation/attribution tests required');
    }

    if (!testFile.includes('priority')) {
      this.fail('MISSING PRIORITY COLLISION TESTS: Tests for priority order enforcement required');
    }

    if (this.failures.filter(f => f.includes('TESTS')).length === 0) {
      this.pass('Test coverage requirements satisfied');
    }
  }

  // 5) TYPE SAFETY
  checkTypeSafety(engineContent) {
    console.log('\n🔍 CHECKING TYPE SAFETY...');
    
    // Check for 'any' types
    const anyMatches = engineContent.match(/:\s*any/g);
    if (anyMatches && anyMatches.length > 0) {
      this.fail('TYPE SAFETY VIOLATION: Found \'any\' types');
      console.error('🔧 FIX: Replace all \'any\' with specific interfaces');
      console.error('   Locations:', anyMatches.length);
    }

    // Check for implicit unknown without narrowing
    const unknownMatches = engineContent.match(/unknown(?!\s*\()/g);
    if (unknownMatches && unknownMatches.length > 0) {
      this.fail('TYPE SAFETY VIOLATION: Found implicit unknown without narrowing');
      console.error('🔧 Fix: Add type guards or explicit type annotations');
    }

    if (this.failures.filter(f => f.includes('TYPE SAFETY')).length === 0) {
      this.pass('Type safety requirements satisfied');
    }
  }

  // 6) DIFF SANITY
  checkDiffSanity(engineContent) {
    console.log('\n🔍 CHECKING DIFF SANITY...');
    
    // Check for console.log outside tests
    const consoleLogMatches = engineContent.match(/console\.log/g);
    if (consoleLogMatches && consoleLogMatches.length > 0) {
      this.fail('DEBUG CODE DETECTED: console.log found in engine');
      console.error('🔧 FIX: Remove all console.log statements');
    }

    // Check for TODO comments
    const todoMatches = engineContent.match(/\/\/ TODO|\/\*[\s\S]*?\*\//g);
    if (todoMatches) {
      const todos = todoMatches.filter(match => match.includes('TODO'));
      if (todos.length > 0) {
        this.fail('TODO COMMENTS DETECTED');
        console.error('🔧 FIX: Resolve all TODO comments before committing');
      }
    }

    if (this.failures.filter(f => f.includes('DEBUG') || f.includes('TODO')).length === 0) {
      this.pass('Diff sanity requirements satisfied');
    }
  }

  // 7) NO SUCCESS-RATE / STATS IN COUNSELOR OUTPUT
  checkNoSuccessStats(engineContent) {
    console.log('\n🔍 CHECKING NO SUCCESS-RATE / STATS...');

    const percentMatches = engineContent.match(/\b\d{1,3}%\b/g);
    if (percentMatches && percentMatches.length > 0) {
      this.fail('SUCCESS-RATE / STATISTICS DETECTED IN COUNSELOR ENGINE');
      console.error('🔧 FIX: Remove percentages/statistics from user-facing counselor responses (use actionable steps + uncertainty language).');
      console.error('   Found:', [...new Set(percentMatches)].slice(0, 10).join(', '));
      return;
    }

    this.pass('No success-rate percentages found');
  }

  run() {
    console.log('🏛️  CANONICAL GOVERNANCE ENFORCEMENT');
    console.log('=====================================');

    try {
      const engineContent = fs.readFileSync('src/lib/ai/counselor-engine.ts', 'utf8');
      
      this.checkPriorityOrder(engineContent);
      this.checkSuicideTriageSafety(engineContent);
      this.checkResponseTemplateContract(engineContent);
      this.checkTestCoverage();
      this.checkTypeSafety(engineContent);
      this.checkDiffSanity(engineContent);
      this.checkNoSuccessStats(engineContent);

      console.log('\n=====================================');
      
      if (this.failures.length > 0) {
        console.error(`\n🚨 GOVERNANCE CHECKS FAILED: ${this.failures.length} violations`);
        console.error('\n📋 SUMMARY OF FAILURES:');
        this.failures.forEach((failure, i) => {
          console.error(`  ${i + 1}. ${failure}`);
        });
        
        if (this.warnings.length > 0) {
          console.warn(`\n⚠️  WARNINGS: ${this.warnings.length}`);
          this.warnings.forEach((warning, i) => {
            console.warn(`  ${i + 1}. ${warning}`);
          });
        }
        
        console.error('\n🛑 BUILD FAILED: Fix all violations before committing');
        process.exit(1);
      } else {
        console.log('\n✅ ALL GOVERNANCE CHECKS PASSED');
        if (this.warnings.length > 0) {
          console.warn(`\n⚠️  WARNINGS: ${this.warnings.length} (non-blocking)`);
        }
        console.log('\n🎉 BUILD APPROVED: Canonical compliance verified');
      }
    } catch (error) {
      console.error('🚨 GOVERNANCE CHECK ERROR:', error.message);
      process.exit(1);
    }
  }
}

// Run governance checks
const checker = new GovernanceChecker();
checker.run();
