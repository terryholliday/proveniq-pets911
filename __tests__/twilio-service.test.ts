/**
 * Tests for Twilio Service
 */
import { twilioService } from '../src/lib/services/twilio-service';

describe('Twilio Service', () => {
  beforeEach(() => {
    // Mock console.log to capture test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendVetSMS', () => {
    it('should send mock SMS when Twilio not configured', async () => {
      const result = await twilioService.sendVetSMS({
        contactName: 'Test Vet Clinic',
        contactPhone: '+1-304-555-0123',
        emergencySummary: 'Critical emergency - dog hit by car',
        callbackNumber: '+1-304-555-9999',
        finderLocation: '123 Main St, Lewisburg, WV',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('mock-message-id');
      expect(console.log).toHaveBeenCalledWith('MOCK SMS to vet:', expect.any(Object));
    });

    it('should handle missing callback number', async () => {
      const result = await twilioService.sendVetSMS({
        contactName: 'Test Vet Clinic',
        contactPhone: '+1-304-555-0123',
        emergencySummary: 'Injured cat',
        callbackNumber: '',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('callVet', () => {
    it('should send mock call when Twilio not configured', async () => {
      const result = await twilioService.callVet({
        contactName: 'Test Vet Clinic',
        contactPhone: '+1-304-555-0123',
        emergencySummary: 'Critical emergency',
        callbackNumber: '+1-304-555-9999',
      });

      expect(result.success).toBe(true);
      expect(result.callId).toBe('mock-call-id');
      expect(console.log).toHaveBeenCalledWith('MOCK CALL to vet:', expect.any(Object));
    });
  });

  describe('notifyVet', () => {
    it('should send SMS and voice for critical emergencies', async () => {
      const result = await twilioService.notifyVet({
        contactName: 'Test Vet Clinic',
        contactPhone: '+1-304-555-0123',
        emergencySummary: 'CRITICAL emergency - severe bleeding',
        callbackNumber: '+1-304-555-9999',
      });

      expect(result.success).toBe(true);
      expect(result.sms).toBeDefined();
      expect(result.voice).toBeDefined();
      expect(result.sms?.status).toBe('sent');
      expect(result.voice?.status).toBe('initiated');
    });

    it('should send only SMS for non-critical emergencies', async () => {
      const result = await twilioService.notifyVet({
        contactName: 'Test Vet Clinic',
        contactPhone: '+1-304-555-0123',
        emergencySummary: 'Minor injury - limping',
        callbackNumber: '+1-304-555-9999',
      });

      expect(result.success).toBe(true);
      expect(result.sms).toBeDefined();
      expect(result.voice).toBeUndefined();
    });
  });
});
