import { Twilio } from 'twilio';

export interface VetNotificationData {
  contactName: string;
  contactPhone: string;
  emergencySummary: string;
  callbackNumber: string;
  finderLocation?: string;
}

export class TwilioService {
  private client: Twilio | null = null;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (accountSid && authToken && this.fromNumber) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      console.warn('Twilio credentials not configured. Notifications will be logged only.');
    }
  }

  /**
   * Send SMS notification to vet clinic
   */
  async sendVetSMS(data: VetNotificationData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.client) {
      console.log('MOCK SMS to vet:', {
        to: data.contactPhone,
        message: this.buildSMSMessage(data),
      });
      return {
        success: true,
        messageId: 'mock-message-id',
      };
    }

    try {
      const message = await this.client.messages.create({
        body: this.buildSMSMessage(data),
        to: data.contactPhone,
        from: this.fromNumber,
      });

      console.log(`SMS sent to ${data.contactName}: ${message.sid}`);
      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Make automated voice call to vet clinic
   */
  async callVet(data: VetNotificationData): Promise<{
    success: boolean;
    callId?: string;
    error?: string;
  }> {
    if (!this.client) {
      console.log('MOCK CALL to vet:', {
        to: data.contactPhone,
        message: this.buildVoiceMessage(data),
      });
      return {
        success: true,
        callId: 'mock-call-id',
      };
    }

    try {
      const call = await this.client.calls.create({
        url: `https://handler.twilio.com/twiml/EHxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`, // TwiML Bin URL
        to: data.contactPhone,
        from: this.fromNumber,
        method: 'GET',
      });

      console.log(`Call initiated to ${data.contactName}: ${call.sid}`);
      return {
        success: true,
        callId: call.sid,
      };
    } catch (error) {
      console.error('Failed to initiate call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send both SMS and attempt voice call
   */
  async notifyVet(data: VetNotificationData): Promise<{
    success: boolean;
    sms?: { messageId: string; status: string };
    voice?: { callId: string; status: string };
    error?: string;
  }> {
    const results: any = {};

    // Send SMS first (more reliable)
    const smsResult = await this.sendVetSMS(data);
    results.sms = {
      messageId: smsResult.messageId || 'failed',
      status: smsResult.success ? 'sent' : 'failed',
    };

    // Attempt voice call for critical emergencies
    if (data.emergencySummary.toLowerCase().includes('critical')) {
      const voiceResult = await this.callVet(data);
      results.voice = {
        callId: voiceResult.callId || 'failed',
        status: voiceResult.success ? 'initiated' : 'failed',
      };
    }

    return {
      success: smsResult.success,
      ...results,
      error: smsResult.error,
    };
  }

  private buildSMSMessage(data: VetNotificationData): string {
    const location = data.finderLocation ? `Location: ${data.finderLocation}` : '';
    
    return `🚨 PetNexus EMERGENCY ALERT 🚨
    
Finder en route with injured animal!
Clinic: ${data.contactName}
Details: ${data.emergencySummary}
${location}
Callback: ${data.callbackNumber}

Please prepare for emergency arrival. Reply READY to confirm.`;
  }

  private buildVoiceMessage(data: VetNotificationData): string {
    return `Hello, this is an automated emergency alert from PetNexus. A finder is currently en route to your clinic with an injured animal that requires immediate care. ${data.emergencySummary}. Please prepare your emergency team. The finder's callback number is ${data.callbackNumber}. Again, this is PetNexus emergency alert. Please prepare for arrival.`;
  }
}

export const twilioService = new TwilioService();
