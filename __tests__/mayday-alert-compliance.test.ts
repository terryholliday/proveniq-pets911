import { FakeClock } from '@/lib/petmayday-alert/fake-clock';
import { ProjectionBuilder } from '@/lib/petmayday-alert/projection-builder';
import { replay } from '@/lib/petmayday-alert/replay';
import { evaluateAlert, extractEvaluateRequest } from '@/lib/petmayday-alert/evaluator';
import { validateAgainstSchema } from '@/lib/petmayday-alert/schema';
import {
  policyEvaluatedSchema,
  alertEmittedSchema,
  alertSuppressedSchema,
} from '@/lib/petmayday-alert/event-schemas';
import { canonicalJsonStringify } from '@/lib/petmayday-alert/canonical-json';
import type { MemoryEvent } from '@/lib/petmayday-alert/types';

import eventsLines from './petmayday-alert-fixtures/events.json';
import expectedAll from './petmayday-alert-fixtures/expected.json';

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: unknown) => any;

type FixtureExpected = {
  eligible_channels: string[];
  emitted_channels: string[];
  suppressed_reasons_by_channel: Record<string, string>;
};

function groupByFixture(lines: { fixture_id: string; event: MemoryEvent }[]): Record<string, MemoryEvent[]> {
  const out: Record<string, MemoryEvent[]> = {};
  for (const line of lines) {
    if (!out[line.fixture_id]) out[line.fixture_id] = [];
    out[line.fixture_id].push(line.event);
  }
  return out;
}

function validateAuditEvent(event: any): void {
  if (event.type === 'petmayday.alert.policy_evaluated') {
    validateAgainstSchema(policyEvaluatedSchema, event);
    return;
  }
  if (event.type === 'petmayday.alert.emitted') {
    validateAgainstSchema(alertEmittedSchema, event);
    return;
  }
  if (event.type === 'petmayday.alert.suppressed') {
    validateAgainstSchema(alertSuppressedSchema, event);
    return;
  }
  throw new Error(`Unknown audit event type: ${event.type}`);
}

describe('petmayday Alert Testing & Compliance', () => {
  it('runs golden fixtures with differential evaluation (projection vs replay) and fail-closed reason codes', () => {
    const grouped = groupByFixture(
      (eventsLines as unknown as { fixture_id: string; event: MemoryEvent }[])
    );

    for (const fx of expectedAll.fixtures) {
      const events = grouped[fx.fixture_id];
      if (!events) throw new Error(`Missing events for fixture: ${fx.fixture_id}`);

      const req = extractEvaluateRequest(events);
      const evalRequested = events.find(e => e.type === 'petmayday.alert.evaluate_requested');
      if (!evalRequested || evalRequested.type !== 'petmayday.alert.evaluate_requested') {
        throw new Error(`Fixture missing evaluate_requested: ${fx.fixture_id}`);
      }

      const clock = new FakeClock(Date.parse(evalRequested.at));

      const dateNowOriginal = Date.now;
      const mathRandomOriginal = Math.random;
      (Date as any).now = () => {
        throw new Error('Date.now must not be used during evaluation');
      };
      Math.random = () => {
        throw new Error('Math.random must not be used during evaluation');
      };

      try {
        const builder = new ProjectionBuilder();
        const projA = builder.build(events);
        const decisionA = evaluateAlert(req, projA, clock);

        const projB = replay(events);
        const decisionB = evaluateAlert(req, projB, clock);

        expect(canonicalJsonStringify(decisionA)).toEqual(canonicalJsonStringify(decisionB));

        for (const ev of decisionA.audit_events) validateAuditEvent(ev);

        const policyEv = decisionA.audit_events.find(e => e.type === 'petmayday.alert.policy_evaluated');
        if (!policyEv || policyEv.type !== 'petmayday.alert.policy_evaluated') {
          throw new Error('Missing policy_evaluated event');
        }

        expect(policyEv.eligible_channels).toEqual(fx.expected.eligible_channels);

        const emittedChannels = decisionA.audit_events
          .filter(e => e.type === 'petmayday.alert.emitted')
          .map(e => (e as any).channel);
        expect(emittedChannels).toEqual(fx.expected.emitted_channels);

        const suppressed = decisionA.audit_events.filter(e => e.type === 'petmayday.alert.suppressed') as any[];
        const suppressedMap: Record<string, string> = {};
        for (const s of suppressed) suppressedMap[s.channel] = s.reason_code;
        expect(suppressedMap).toEqual(fx.expected.suppressed_reasons_by_channel);
      } finally {
        (Date as any).now = dateNowOriginal;
        Math.random = mathRandomOriginal;
      }
    }
  });
});
