import { createClientForAPI } from '@/lib/supabase/client';

export interface NotificationData {
  sighting_id: string;
  type: 'STATUS_UPDATE' | 'ETA_UPDATE' | 'RESOLVER_ARRIVAL' | 'SAFETY_GUIDE';
  message: string;
  recipient_id?: string;
  recipient_phone?: string;
  recipient_email?: string;
}

export class NotificationService {
  private supabase = createClientForAPI();

  async sendNotification(data: NotificationData): Promise<void> {
    try {
      // Store notification in database
      const { error: dbError } = await this.supabase
        .from('sighting_notification')
        .insert({
          sighting_id: data.sighting_id,
          type: data.type,
          message: data.message,
          recipient_id: data.recipient_id || null,
          recipient_phone: data.recipient_phone || null,
          recipient_email: data.recipient_email || null,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Failed to store notification:', dbError);
        return;
      }

      // Send push notification if recipient has push enabled
      if (data.recipient_id) {
        await this.sendPushNotification(data);
      }

      // Send SMS if phone number provided
      if (data.recipient_phone) {
        await this.sendSMSNotification(data);
      }

      // Send email if email provided
      if (data.recipient_email) {
        await this.sendEmailNotification(data);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async sendPushNotification(data: NotificationData): Promise<void> {
    // TODO: Implement push notifications using Firebase Cloud Messaging
    console.log('Push notification:', data.message);
  }

  private async sendSMSNotification(data: NotificationData): Promise<void> {
    // TODO: Implement SMS using Twilio
    console.log(`SMS to ${data.recipient_phone}:`, data.message);
  }

  private async sendEmailNotification(data: NotificationData): Promise<void> {
    // TODO: Implement email using Resend
    console.log(`Email to ${data.recipient_email}:`, data.message);
  }

  async getNotificationsForSighting(sightingId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('sighting_notification')
      .select('*')
      .eq('sighting_id', sightingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('sighting_notification')
      .update({ 
        read_at: new Date().toISOString(),
        status: 'DELIVERED'
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export const notificationService = new NotificationService();
