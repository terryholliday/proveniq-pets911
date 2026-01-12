// Pet911 Certificate Generation Service
// Generates PDF certificates with QR codes for verification

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { createClient } from '@supabase/supabase-js';
import { Certification, TrainingModule, TRACK_CONFIG } from '@/types/training';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CertificateData {
  certificateNumber: string;
  holderName: string;
  title: string;
  track: string;
  issuedAt: Date;
  expiresAt?: Date;
  finalScore?: number;
  verificationHash: string;
}

export class CertificateService {
  
  /**
   * Generate a PDF certificate
   */
  async generateCertificatePDF(certificationId: string): Promise<Buffer> {
    // 1. Get certification with related data
    const { data: cert, error } = await supabase
      .from('volunteer_certifications')
      .select(`
        *,
        module:training_modules(*),
        user:auth.users(raw_user_meta_data)
      `)
      .eq('id', certificationId)
      .single();

    if (error || !cert) {
      throw new Error('Certification not found');
    }

    // 2. Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', cert.user_id)
      .single();

    const holderName = profile?.full_name || cert.user?.raw_user_meta_data?.full_name || 'Volunteer';

    // 3. Prepare certificate data
    const certData: CertificateData = {
      certificateNumber: cert.certificate_number,
      holderName,
      title: cert.title,
      track: cert.module?.track || 'all',
      issuedAt: new Date(cert.issued_at),
      expiresAt: cert.expires_at ? new Date(cert.expires_at) : undefined,
      finalScore: cert.final_score,
      verificationHash: cert.verification_hash,
    };

    // 4. Generate PDF
    const pdfBytes = await this.createPDF(certData);

    // 5. Upload to storage and update record
    const fileName = `certificates/${cert.user_id}/${cert.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('training')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('training')
        .getPublicUrl(fileName);

      await supabase
        .from('volunteer_certifications')
        .update({ pdf_url: urlData.publicUrl })
        .eq('id', certificationId);
    }

    return Buffer.from(pdfBytes);
  }

  /**
   * Create PDF document
   */
  private async createPDF(data: CertificateData): Promise<Uint8Array> {
    // Create a new PDF document (Letter size: 612 x 792 points)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]); // Landscape

    // Load fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const { width, height } = page.getSize();
    const trackConfig = TRACK_CONFIG[data.track as keyof typeof TRACK_CONFIG] || TRACK_CONFIG.all;

    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.6); // Dark blue
    const goldColor = rgb(0.72, 0.53, 0.04); // Gold
    const grayColor = rgb(0.4, 0.4, 0.4);

    // ===== BORDER =====
    // Outer border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: goldColor,
      borderWidth: 3,
    });

    // Inner border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: primaryColor,
      borderWidth: 1,
    });

    // ===== HEADER =====
    // Logo placeholder (text for now)
    page.drawText('PET911', {
      x: 50,
      y: height - 70,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });

    page.drawText('TRAINING ACADEMY', {
      x: 50,
      y: height - 90,
      size: 10,
      font: helvetica,
      color: grayColor,
    });

    // Certificate title
    const titleText = 'Certificate of Completion';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 32);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 120,
      size: 32,
      font: helveticaBold,
      color: primaryColor,
    });

    // ===== BODY =====
    // "This certifies that"
    const certifiesText = 'This certifies that';
    const certifiesWidth = timesItalic.widthOfTextAtSize(certifiesText, 14);
    page.drawText(certifiesText, {
      x: (width - certifiesWidth) / 2,
      y: height - 180,
      size: 14,
      font: timesItalic,
      color: grayColor,
    });

    // Holder name
    const nameWidth = timesRoman.widthOfTextAtSize(data.holderName, 36);
    page.drawText(data.holderName, {
      x: (width - nameWidth) / 2,
      y: height - 230,
      size: 36,
      font: timesRoman,
      color: rgb(0, 0, 0),
    });

    // Underline for name
    const lineWidth = Math.max(nameWidth + 40, 300);
    page.drawLine({
      start: { x: (width - lineWidth) / 2, y: height - 240 },
      end: { x: (width + lineWidth) / 2, y: height - 240 },
      thickness: 1,
      color: goldColor,
    });

    // "has successfully completed"
    const completedText = 'has successfully completed the';
    const completedWidth = timesItalic.widthOfTextAtSize(completedText, 14);
    page.drawText(completedText, {
      x: (width - completedWidth) / 2,
      y: height - 280,
      size: 14,
      font: timesItalic,
      color: grayColor,
    });

    // Module/Course title
    const courseWidth = helveticaBold.widthOfTextAtSize(data.title, 24);
    page.drawText(data.title, {
      x: (width - courseWidth) / 2,
      y: height - 320,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });

    // Track badge
    const badgeText = `${trackConfig.icon} ${trackConfig.badgeTitle}`;
    const badgeWidth = helvetica.widthOfTextAtSize(badgeText, 14);
    page.drawText(badgeText, {
      x: (width - badgeWidth) / 2,
      y: height - 350,
      size: 14,
      font: helvetica,
      color: goldColor,
    });

    // Score if available
    if (data.finalScore) {
      const scoreText = `Final Score: ${data.finalScore}%`;
      const scoreWidth = helvetica.widthOfTextAtSize(scoreText, 12);
      page.drawText(scoreText, {
        x: (width - scoreWidth) / 2,
        y: height - 380,
        size: 12,
        font: helvetica,
        color: grayColor,
      });
    }

    // ===== FOOTER =====
    // Issue date
    page.drawText('Issued:', {
      x: 80,
      y: 120,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    page.drawText(this.formatDate(data.issuedAt), {
      x: 80,
      y: 105,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Expiration date (if applicable)
    if (data.expiresAt) {
      page.drawText('Valid Until:', {
        x: 200,
        y: 120,
        size: 10,
        font: helvetica,
        color: grayColor,
      });
      page.drawText(this.formatDate(data.expiresAt), {
        x: 200,
        y: 105,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
    }

    // Certificate number
    page.drawText('Certificate No:', {
      x: 350,
      y: 120,
      size: 10,
      font: helvetica,
      color: grayColor,
    });
    page.drawText(data.certificateNumber, {
      x: 350,
      y: 105,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // QR Code for verification
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${data.verificationHash}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 80,
      margin: 0,
      color: { dark: '#1a365d', light: '#ffffff' },
    });

    // Convert data URL to bytes
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawImage(qrImage, {
      x: width - 130,
      y: 70,
      width: 80,
      height: 80,
    });

    page.drawText('Scan to Verify', {
      x: width - 130,
      y: 55,
      size: 8,
      font: helvetica,
      color: grayColor,
    });

    // Signature line
    page.drawLine({
      start: { x: width / 2 - 100, y: 90 },
      end: { x: width / 2 + 100, y: 90 },
      thickness: 1,
      color: grayColor,
    });

    page.drawText('PROVENIQ Charitable Trust', {
      x: width / 2 - 70,
      y: 70,
      size: 10,
      font: helvetica,
      color: grayColor,
    });

    // Disclaimer
    const disclaimer = 'This certificate verifies completion of training requirements. It does not constitute employment or professional licensure.';
    const disclaimerWidth = helvetica.widthOfTextAtSize(disclaimer, 8);
    page.drawText(disclaimer, {
      x: (width - disclaimerWidth) / 2,
      y: 35,
      size: 8,
      font: helvetica,
      color: grayColor,
    });

    return pdfDoc.save();
  }

  /**
   * Verify a certificate by hash
   */
  async verifyCertificate(hash: string): Promise<{
    valid: boolean;
    certificate?: {
      certificateNumber: string;
      holderName: string;
      title: string;
      issuedAt: Date;
      expiresAt?: Date;
      status: string;
    };
    error?: string;
  }> {
    const { data: cert, error } = await supabase
      .from('volunteer_certifications')
      .select(`
        *,
        module:training_modules(title),
        user_id
      `)
      .eq('verification_hash', hash)
      .single();

    if (error || !cert) {
      return { valid: false, error: 'Certificate not found' };
    }

    // Get user name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', cert.user_id)
      .single();

    // Check if expired
    if (cert.expires_at && new Date(cert.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'Certificate has expired',
        certificate: {
          certificateNumber: cert.certificate_number,
          holderName: profile?.full_name || 'Unknown',
          title: cert.title,
          issuedAt: new Date(cert.issued_at),
          expiresAt: new Date(cert.expires_at),
          status: 'expired',
        },
      };
    }

    // Check if revoked/suspended
    if (cert.status !== 'active') {
      return {
        valid: false,
        error: `Certificate status: ${cert.status}`,
        certificate: {
          certificateNumber: cert.certificate_number,
          holderName: profile?.full_name || 'Unknown',
          title: cert.title,
          issuedAt: new Date(cert.issued_at),
          expiresAt: cert.expires_at ? new Date(cert.expires_at) : undefined,
          status: cert.status,
        },
      };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: cert.certificate_number,
        holderName: profile?.full_name || 'Unknown',
        title: cert.title,
        issuedAt: new Date(cert.issued_at),
        expiresAt: cert.expires_at ? new Date(cert.expires_at) : undefined,
        status: 'active',
      },
    };
  }

  /**
   * Check and update expired certifications
   */
  async processExpirations(): Promise<number> {
    const { data: expired, error } = await supabase
      .from('volunteer_certifications')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error('Failed to process expirations');
    }

    // Also update related progress records
    if (expired && expired.length > 0) {
      await supabase
        .from('training_user_progress')
        .update({ status: 'expired' })
        .in('certificate_id', expired.map(e => e.id));
    }

    return expired?.length || 0;
  }

  /**
   * Send recertification reminders
   */
  async sendRecertificationReminders(daysBeforeExpiry: number[]): Promise<void> {
    for (const days of daysBeforeExpiry) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: expiring } = await supabase
        .from('volunteer_certifications')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('status', 'active')
        .gte('expires_at', startOfDay.toISOString())
        .lte('expires_at', endOfDay.toISOString());

      if (expiring && expiring.length > 0) {
        // TODO: Send email notifications
        console.log(`Found ${expiring.length} certifications expiring in ${days} days`);
      }
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const certificateService = new CertificateService();
