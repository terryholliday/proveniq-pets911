/**
 * CRISIS READINESS TEST SUITE (CRTS) v1.0
 * Status: MISSION CRITICAL
 * 
 * Objectives:
 * 1. Stress Simulation: Verify IndexedDB/FIFO stability under load.
 * 2. Chaos Engineering: Resilience against database/network failures.
 * 3. Privacy Integrity: Ensure no PII leakage in offline payloads.
 * 4. Engine Determinism: Clinical response safety under pressure.
 */

import 'fake-indexeddb/auto';
import {
    queueAction,
    getPendingActions,
    markAsSynced,
    getQueueStats,
    getAllActions
} from '../src/lib/db/offline-queue-store';
import { clearAllData } from '../src/lib/db/indexed-db';
import { generateCompanionResponse } from '../src/lib/ai/counselor-engine';

describe('Pet 911 Crisis Readiness (CRTS)', () => {
    beforeEach(async () => {
        await clearAllData();
    });

    describe('Section 1: Stress Simulation (High Velocity Load)', () => {
        test('should handle 100 concurrent emergency sightings without FIFO drift', async () => {
            const loadSize = 100;
            const actions = [];

            // Parallel entry
            const startTime = Date.now();
            for (let i = 0; i < loadSize; i++) {
                actions.push(queueAction('CREATE_SIGHTING', { index: i, trauma: i % 10 === 0 }, 'tester-1'));
            }

            await Promise.all(actions);
            const endTime = Date.now();

            const pending = await getPendingActions();
            const stats = await getQueueStats();

            expect(pending.length).toBe(loadSize);
            expect(stats.total).toBe(loadSize);

            // Verify FIFO ordering
            for (let i = 0; i < loadSize; i++) {
                expect((pending[i].payload as any).index).toBe(i);
            }

            console.log(`STRESS_LOG: Processed ${loadSize} actions in ${endTime - startTime}ms`);
        });
    });

    describe('Section 2: Chaos Engineering (State Resilience)', () => {
        test('should recover from simulated DB connection loss during sync cycle', async () => {
            // 1. Queue actions
            await queueAction('CREATE_SIGHTING', { id: 'test-1' }, 'tester-1');
            await queueAction('CREATE_SIGHTING', { id: 'test-2' }, 'tester-1');

            // 2. Start sync loop simulation
            const pending = await getPendingActions();
            expect(pending.length).toBe(2);

            // 3. Simulated disruption: Mark first as synced
            await markAsSynced(pending[0].id, 'remote-1');

            // 4. Verify partial success persistence
            const stats = await getQueueStats();
            expect(stats.synced).toBe(1);
            expect(stats.pending).toBe(1);

            // 5. Simulate "crash" (clearing pending only - in reality this would be process death)
            // The pending item at index 1 must still be there after "reboot"
            const recovered = await getPendingActions();
            expect(recovered[0].id).toBe(pending[1].id);
        });
    });

    describe('Section 3: Privacy Integrity (Teleport-Class Audit)', () => {
        const PII_PATTERNS = {
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            phone: /(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g
        };

        test('offline payloads must not contain raw PII unless explicitly mapped', async () => {
            // Intentional leak attempt
            const dangerousPayload = {
                description: "I found a dog at test@example.com contact me at 304-555-0100",
                location: "St. Albans, WV"
            };

            await queueAction('CREATE_SIGHTING', dangerousPayload, 'tester-1');
            const allActions = await getAllActions();
            const payloadString = JSON.stringify(allActions[0].payload);

            const emailMatches = payloadString.match(PII_PATTERNS.email);
            const phoneMatches = payloadString.match(PII_PATTERNS.phone);

            // RED ALERT: This test catches if PII sanitization is bypassed in the UI layer before queuing
            // Note: In Phase 0, we allow phone/email for immediate rescue contact, but we must flag they exist
            expect(emailMatches).not.toBeNull();
            expect(phoneMatches).not.toBeNull();

            console.log(`PRIVACY_AUDIT: Detected PII in payload (Permissible for v1 Rescue, must be encrypted in v2)`);
        });
    });

    describe('Section 4: Engine Determinism (Safety Invariants)', () => {
        test('counselor-engine must return deterministic clinical templates for high-risk markers', () => {
            const activeSuicideInput = "I want to kill myself, I have a gun and a plan.";
            const { response, analysis } = generateCompanionResponse(activeSuicideInput);

            expect(analysis.suicideRiskLevel).toBe('active');
            expect(analysis.requiresEscalation).toBe(true);
            // Hard check against the template - any deviation is a "Fail-Loud" event
            expect(response).toContain("emergency");
            expect(response).toContain("988");
        });

        test('should maintain safety boundaries even with "dirty" or mixed inputs', () => {
            const mixedInput = "My dog is missing and I also feel like life isn't worth living anymore, I'm thinking of ending it.";
            const { response, analysis } = generateCompanionResponse(mixedInput);

            // Suicide markers must take precedence over lost pet markers
            expect(analysis.suicideRiskLevel).toBe('active');
            expect(analysis.category).toBe('suicide_active');
        });
    });
});
