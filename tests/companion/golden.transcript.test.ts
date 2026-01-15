/**
 * Golden Transcript Tests
 * Runs predefined conversation transcripts through the pipeline
 * and validates structured output against expectations
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  runTranscript,
  runBatch,
  type GoldenTranscript,
  type BatchResult,
} from './test-harness';

// Load all fixtures from the fixtures directory
function loadFixtures(): GoldenTranscript[] {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'));
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
    return JSON.parse(content) as GoldenTranscript;
  });
}

describe('Golden Transcripts', () => {
  const fixtures = loadFixtures();
  
  describe('Individual Transcript Tests', () => {
    for (const fixture of fixtures) {
      describe(fixture.name, () => {
        it(`should pass all turns (${fixture.turns.length} turns)`, () => {
          const result = runTranscript(fixture);
          
          if (!result.passed) {
            console.error(`Failed transcript: ${fixture.name}`);
            console.error(`Violations:\n${result.allViolations.join('\n')}`);
          }
          
          expect(result.passed).toBe(true);
        });
        
        it('should have zero false negatives', () => {
          const result = runTranscript(fixture);
          
          if (result.confusionSummary.falseNegatives > 0) {
            console.error(`FALSE NEGATIVE DETECTED in ${fixture.name}!`);
            const fnTurns = result.turnResults.filter(t => t.confusion.isFalseNegative);
            for (const turn of fnTurns) {
              console.error(`  Turn ${turn.turnIndex}: "${turn.userMessage}"`);
              console.error(`    Expected: ${turn.confusion.expectedSeverity}, Got: ${turn.confusion.actualSeverity}`);
            }
          }
          
          expect(result.confusionSummary.falseNegatives).toBe(0);
        });
      });
    }
  });
  
  describe('Batch Validation', () => {
    it('should pass all fixtures in batch', () => {
      const result = runBatch(fixtures);
      
      console.log(`\n=== Batch Results ===`);
      console.log(`Total: ${result.totalTranscripts}`);
      console.log(`Passed: ${result.passed}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`False Negatives: ${result.totalFalseNegatives}`);
      console.log(`False Positives: ${result.totalFalsePositives}`);
      console.log(`Deployment Blocked: ${result.deploymentBlocked}`);
      
      if (result.blockingReasons.length > 0) {
        console.log(`\nBlocking Reasons:`);
        result.blockingReasons.forEach(r => console.log(`  - ${r}`));
      }
      
      expect(result.deploymentBlocked).toBe(false);
    });
    
    it('should have zero false negatives across all fixtures', () => {
      const result = runBatch(fixtures);
      
      // FALSE NEGATIVES = DEPLOYMENT BLOCKER
      expect(result.totalFalseNegatives).toBe(0);
    });
  });
});

describe('P0 Safety Tests (Deployment Blocking)', () => {
  const fixtures = loadFixtures();
  const p0Fixtures = fixtures.filter(f => f.tags.includes('P0'));
  
  it('should have P0 fixtures loaded', () => {
    expect(p0Fixtures.length).toBeGreaterThan(0);
  });
  
  for (const fixture of p0Fixtures) {
    it(`P0: ${fixture.name} should pass`, () => {
      const result = runTranscript(fixture);
      
      if (!result.passed) {
        console.error(`P0 FAILURE: ${fixture.name}`);
        console.error(`Violations:\n${result.allViolations.join('\n')}`);
      }
      
      expect(result.passed).toBe(true);
    });
  }
});

describe('Memory Tests', () => {
  const fixtures = loadFixtures();
  const memoryFixtures = fixtures.filter(f => f.tags.includes('memory'));
  
  for (const fixture of memoryFixtures) {
    it(`Memory: ${fixture.name} should not re-ask known facts`, () => {
      const result = runTranscript(fixture);
      
      // Check that no turn violated anti-repetition
      const repetitionViolations = result.allViolations.filter(v => 
        v.includes('Should NOT request') || v.includes('Re-asked')
      );
      
      if (repetitionViolations.length > 0) {
        console.error(`Memory violations in ${fixture.name}:`);
        repetitionViolations.forEach(v => console.error(`  - ${v}`));
      }
      
      expect(repetitionViolations).toHaveLength(0);
    });
  }
});

describe('Crisis Detection Tests', () => {
  const fixtures = loadFixtures();
  const crisisFixtures = fixtures.filter(f => 
    f.tags.includes('crisis') || f.tags.includes('safety')
  );
  
  for (const fixture of crisisFixtures) {
    it(`Crisis: ${fixture.name} should detect crisis correctly`, () => {
      const result = runTranscript(fixture);
      
      // Zero false negatives for crisis tests
      expect(result.confusionSummary.falseNegatives).toBe(0);
    });
  }
});

describe('Scam Detection Tests', () => {
  const fixtures = loadFixtures();
  const scamFixtures = fixtures.filter(f => f.tags.includes('scam'));
  
  for (const fixture of scamFixtures) {
    it(`Scam: ${fixture.name} should detect scam`, () => {
      const result = runTranscript(fixture);
      
      // Check that scam mode was triggered
      const scamModeTurns = result.turnResults.filter(t => 
        t.pipelineOutput.mode === 'scam'
      );
      
      expect(scamModeTurns.length).toBeGreaterThan(0);
    });
  }
});

describe('Lost Pet Tests', () => {
  const fixtures = loadFixtures();
  const lostPetFixtures = fixtures.filter(f => f.tags.includes('lost_pet'));
  
  for (const fixture of lostPetFixtures) {
    it(`Lost Pet: ${fixture.name} should extract facts`, () => {
      const result = runTranscript(fixture);
      
      // Should be in lost_pet mode at some point
      const lostPetTurns = result.turnResults.filter(t => 
        t.pipelineOutput.mode === 'lost_pet'
      );
      
      expect(lostPetTurns.length).toBeGreaterThan(0);
    });
  }
});
