/**
 * OPERATIONS MODULE - COMMUNICATION TEMPLATES
 * 
 * Standardized message templates for consistent communication.
 */

import type { UserId, AuditMetadata } from '../types';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE TYPES
// ═══════════════════════════════════════════════════════════════════

export type TemplateCategory = 
  | 'case_update'
  | 'verification'
  | 'dispatch'
  | 'volunteer'
  | 'safety'
  | 'system'
  | 'marketing'
  | 'legal';

export type TemplateChannel = 
  | 'email'
  | 'sms'
  | 'push'
  | 'in_app'
  | 'phone_script';

export type TemplateSensitivity = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  channels: TemplateChannel[];
  
  // Content
  subject?: string;
  body: string;
  bodyHtml?: string;
  shortBody?: string; // For SMS
  
  // Variables
  variables: TemplateVariable[];
  requiredVariables: string[];
  
  // Versioning
  version: string;
  previousVersion?: string;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  
  // Sensitivity
  sensitivity: TemplateSensitivity;
  
  // Localization
  locale: string;
  translations?: Record<string, {
    subject?: string;
    body: string;
    bodyHtml?: string;
    shortBody?: string;
  }>;
  
  // Usage
  usageCount: number;
  lastUsedAt?: string;
  
  // Approval
  approvedBy?: UserId;
  approvedAt?: string;
  
  audit: AuditMetadata;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'url' | 'phone' | 'email';
  required: boolean;
  defaultValue?: string;
  format?: string;
  example?: string;
}

// ═══════════════════════════════════════════════════════════════════
// STANDARD TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const STANDARD_TEMPLATES: Omit<MessageTemplate, 'id' | 'audit' | 'usageCount' | 'lastUsedAt'>[] = [
  // Case Updates
  {
    name: 'case_created',
    description: 'Confirmation when a new case is created',
    category: 'case_update',
    channels: ['email', 'sms', 'push'],
    subject: 'Your petmayday Case Has Been Created - {{caseNumber}}',
    body: `Dear {{ownerName}},

Your case has been successfully created and assigned case number {{caseNumber}}.

Case Details:
- Type: {{caseType}}
- Pet: {{petName}} ({{petSpecies}})
- Location: {{location}}

What happens next:
1. Our team will review your case within {{triageTime}}
2. You'll receive updates as we make progress
3. We may reach out for additional information

You can view your case status at: {{caseUrl}}

If you have any urgent updates, please reply to this message.

Best regards,
The petmayday Team`,
    shortBody: 'petmayday: Case {{caseNumber}} created for {{petName}}. View status: {{caseUrl}}',
    variables: [
      { name: 'ownerName', description: 'Owner name', type: 'string', required: true, example: 'John' },
      { name: 'caseNumber', description: 'Case number', type: 'string', required: true, example: 'P911-2026-001234' },
      { name: 'caseType', description: 'Type of case', type: 'string', required: true, example: 'Lost Pet' },
      { name: 'petName', description: 'Pet name', type: 'string', required: true, example: 'Max' },
      { name: 'petSpecies', description: 'Pet species', type: 'string', required: true, example: 'Dog' },
      { name: 'location', description: 'Last known location', type: 'string', required: true, example: 'Austin, TX' },
      { name: 'triageTime', description: 'Expected triage time', type: 'string', required: false, defaultValue: '30 minutes', example: '30 minutes' },
      { name: 'caseUrl', description: 'Case status URL', type: 'url', required: true, example: 'https://petmayday.org/case/123' },
    ],
    requiredVariables: ['ownerName', 'caseNumber', 'caseType', 'petName', 'petSpecies', 'location', 'caseUrl'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'public',
    locale: 'en-US',
  },
  
  {
    name: 'potential_match_found',
    description: 'Notification when a potential match is found',
    category: 'case_update',
    channels: ['email', 'sms', 'push', 'phone_script'],
    subject: 'Potential Match Found for {{petName}} - Case {{caseNumber}}',
    body: `Dear {{ownerName}},

Great news! We've found a potential match for {{petName}}.

Match Details:
- Confidence: {{matchConfidence}}
- Location Found: {{foundLocation}}
- Date Found: {{foundDate}}
- Current Status: {{currentStatus}}

IMPORTANT: Please do not share this information publicly until we've verified the match.

Next Steps:
1. Review the match at: {{matchUrl}}
2. Provide any additional identifying information
3. Our team will guide you through the verification process

If this is your pet, we'll arrange for a safe reunion. If not, we'll continue searching.

Questions? Reply to this message or call {{supportPhone}}.

Best regards,
The petmayday Team`,
    shortBody: 'petmayday: Potential match found for {{petName}}! Check details: {{matchUrl}}',
    variables: [
      { name: 'ownerName', description: 'Owner name', type: 'string', required: true, example: 'John' },
      { name: 'petName', description: 'Pet name', type: 'string', required: true, example: 'Max' },
      { name: 'caseNumber', description: 'Case number', type: 'string', required: true, example: 'P911-2026-001234' },
      { name: 'matchConfidence', description: 'Match confidence level', type: 'string', required: true, example: 'High' },
      { name: 'foundLocation', description: 'Where pet was found', type: 'string', required: true, example: 'Downtown Austin' },
      { name: 'foundDate', description: 'When pet was found', type: 'date', required: true, example: 'January 11, 2026' },
      { name: 'currentStatus', description: 'Current status of found pet', type: 'string', required: true, example: 'Safe at shelter' },
      { name: 'matchUrl', description: 'Match details URL', type: 'url', required: true, example: 'https://petmayday.org/match/123' },
      { name: 'supportPhone', description: 'Support phone number', type: 'phone', required: false, defaultValue: '1-800-PET-911', example: '1-800-PET-911' },
    ],
    requiredVariables: ['ownerName', 'petName', 'caseNumber', 'matchConfidence', 'foundLocation', 'foundDate', 'currentStatus', 'matchUrl'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'confidential',
    locale: 'en-US',
  },
  
  // Verification
  {
    name: 'verification_required',
    description: 'Request for ownership verification',
    category: 'verification',
    channels: ['email', 'sms'],
    subject: 'Ownership Verification Required - Case {{caseNumber}}',
    body: `Dear {{claimantName}},

Thank you for your ownership claim for case {{caseNumber}}.

To protect both you and the pet, we need to verify your ownership before release.

Please provide the following:
{{verificationItems}}

You can upload documents at: {{uploadUrl}}

Verification Deadline: {{deadline}}

Why we verify:
Pet theft is a real concern, and we take every precaution to ensure pets are returned to their rightful owners.

Questions about verification? Visit: {{faqUrl}}

Best regards,
The petmayday Team`,
    shortBody: 'petmayday: Ownership verification needed for case {{caseNumber}}. Upload docs: {{uploadUrl}}',
    variables: [
      { name: 'claimantName', description: 'Claimant name', type: 'string', required: true, example: 'John' },
      { name: 'caseNumber', description: 'Case number', type: 'string', required: true, example: 'P911-2026-001234' },
      { name: 'verificationItems', description: 'List of verification items needed', type: 'string', required: true, example: '- Photo ID\n- Vet records\n- Recent photos' },
      { name: 'uploadUrl', description: 'Document upload URL', type: 'url', required: true, example: 'https://petmayday.org/verify/123' },
      { name: 'deadline', description: 'Verification deadline', type: 'date', required: true, example: 'January 15, 2026' },
      { name: 'faqUrl', description: 'FAQ URL', type: 'url', required: false, defaultValue: 'https://petmayday.org/faq/verification', example: 'https://petmayday.org/faq/verification' },
    ],
    requiredVariables: ['claimantName', 'caseNumber', 'verificationItems', 'uploadUrl', 'deadline'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'confidential',
    locale: 'en-US',
  },
  
  // Dispatch
  {
    name: 'dispatch_assignment',
    description: 'Notification to volunteer about dispatch assignment',
    category: 'dispatch',
    channels: ['push', 'sms', 'email'],
    subject: 'New Dispatch Assignment - {{dispatchType}}',
    body: `Hi {{volunteerName}},

You've been assigned a new dispatch:

Details:
- Type: {{dispatchType}}
- Priority: {{priority}}
- Case: {{caseNumber}}

Pickup Location:
{{pickupAddress}}
Contact: {{pickupContact}} ({{pickupPhone}})

{{#if destinationAddress}}
Destination:
{{destinationAddress}}
Contact: {{destinationContact}} ({{destinationPhone}})
{{/if}}

Special Instructions:
{{instructions}}

Please accept or decline within {{responseTime}} minutes.

Accept: {{acceptUrl}}
Decline: {{declineUrl}}

Questions? Contact dispatch at {{dispatchPhone}}.

Thank you for volunteering!`,
    shortBody: 'petmayday Dispatch: {{dispatchType}} at {{pickupAddress}}. Accept: {{acceptUrl}}',
    variables: [
      { name: 'volunteerName', description: 'Volunteer name', type: 'string', required: true, example: 'Sarah' },
      { name: 'dispatchType', description: 'Type of dispatch', type: 'string', required: true, example: 'Transport' },
      { name: 'priority', description: 'Priority level', type: 'string', required: true, example: 'High' },
      { name: 'caseNumber', description: 'Case number', type: 'string', required: true, example: 'P911-2026-001234' },
      { name: 'pickupAddress', description: 'Pickup address', type: 'string', required: true, example: '123 Main St, Austin, TX' },
      { name: 'pickupContact', description: 'Pickup contact name', type: 'string', required: true, example: 'John Doe' },
      { name: 'pickupPhone', description: 'Pickup contact phone', type: 'phone', required: true, example: '512-555-1234' },
      { name: 'destinationAddress', description: 'Destination address', type: 'string', required: false, example: '456 Oak Ave, Austin, TX' },
      { name: 'destinationContact', description: 'Destination contact name', type: 'string', required: false, example: 'Jane Smith' },
      { name: 'destinationPhone', description: 'Destination contact phone', type: 'phone', required: false, example: '512-555-5678' },
      { name: 'instructions', description: 'Special instructions', type: 'string', required: false, defaultValue: 'No special instructions', example: 'Animal may be frightened' },
      { name: 'responseTime', description: 'Response time in minutes', type: 'number', required: false, defaultValue: '15', example: '15' },
      { name: 'acceptUrl', description: 'Accept dispatch URL', type: 'url', required: true, example: 'https://petmayday.org/dispatch/123/accept' },
      { name: 'declineUrl', description: 'Decline dispatch URL', type: 'url', required: true, example: 'https://petmayday.org/dispatch/123/decline' },
      { name: 'dispatchPhone', description: 'Dispatch phone number', type: 'phone', required: false, defaultValue: '1-800-PET-911', example: '1-800-PET-911' },
    ],
    requiredVariables: ['volunteerName', 'dispatchType', 'priority', 'caseNumber', 'pickupAddress', 'pickupContact', 'pickupPhone', 'acceptUrl', 'declineUrl'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'internal',
    locale: 'en-US',
  },
  
  // Safety
  {
    name: 'safety_checkin_overdue',
    description: 'Alert when volunteer check-in is overdue',
    category: 'safety',
    channels: ['sms', 'push', 'phone_script'],
    subject: 'URGENT: Safety Check-In Required',
    body: `{{volunteerName}},

Your safety check-in is OVERDUE.

Last Check-In: {{lastCheckinTime}}
Expected Check-In: {{expectedCheckinTime}}
Location: {{lastKnownLocation}}

PLEASE RESPOND IMMEDIATELY by:
1. Tapping "I'm OK" in the app: {{checkinUrl}}
2. Or replying "OK" to this message
3. Or calling {{emergencyLine}}

If we don't hear from you within {{escalationTime}} minutes, we will:
- Contact your emergency contact: {{emergencyContactName}}
- Alert the on-call coordinator

Your safety is our priority.

petmayday Safety Team`,
    shortBody: 'URGENT petmayday: Safety check-in overdue! Reply OK or tap: {{checkinUrl}}',
    variables: [
      { name: 'volunteerName', description: 'Volunteer name', type: 'string', required: true, example: 'Sarah' },
      { name: 'lastCheckinTime', description: 'Last check-in time', type: 'string', required: true, example: '2:30 PM' },
      { name: 'expectedCheckinTime', description: 'Expected check-in time', type: 'string', required: true, example: '3:00 PM' },
      { name: 'lastKnownLocation', description: 'Last known location', type: 'string', required: true, example: '123 Main St, Austin, TX' },
      { name: 'checkinUrl', description: 'Check-in URL', type: 'url', required: true, example: 'https://petmayday.org/checkin' },
      { name: 'emergencyLine', description: 'Emergency phone line', type: 'phone', required: false, defaultValue: '1-800-PET-911', example: '1-800-PET-911' },
      { name: 'escalationTime', description: 'Time until escalation in minutes', type: 'number', required: false, defaultValue: '15', example: '15' },
      { name: 'emergencyContactName', description: 'Emergency contact name', type: 'string', required: true, example: 'John (spouse)' },
    ],
    requiredVariables: ['volunteerName', 'lastCheckinTime', 'expectedCheckinTime', 'lastKnownLocation', 'checkinUrl', 'emergencyContactName'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'restricted',
    locale: 'en-US',
  },
  
  // Volunteer
  {
    name: 'volunteer_application_approved',
    description: 'Notification when volunteer application is approved',
    category: 'volunteer',
    channels: ['email'],
    subject: 'Welcome to petmayday - Your Application Has Been Approved!',
    body: `Dear {{volunteerName}},

Congratulations! Your volunteer application has been approved.

Your Role: {{roleName}}
Region: {{regionName}}
Start Date: {{startDate}}

Next Steps:
1. Complete required training at: {{trainingUrl}}
2. Review the volunteer handbook: {{handbookUrl}}
3. Set up your volunteer profile: {{profileUrl}}
4. Join our volunteer community: {{communityUrl}}

Your mentor is {{mentorName}} ({{mentorEmail}}). They'll reach out within 48 hours to help you get started.

Training modules to complete:
{{trainingModules}}

We're excited to have you on the team!

Best regards,
The petmayday Volunteer Team`,
    shortBody: 'petmayday: Your volunteer application is approved! Complete training: {{trainingUrl}}',
    variables: [
      { name: 'volunteerName', description: 'Volunteer name', type: 'string', required: true, example: 'Sarah' },
      { name: 'roleName', description: 'Assigned role', type: 'string', required: true, example: 'Transporter' },
      { name: 'regionName', description: 'Assigned region', type: 'string', required: true, example: 'Austin Metro' },
      { name: 'startDate', description: 'Start date', type: 'date', required: true, example: 'January 15, 2026' },
      { name: 'trainingUrl', description: 'Training portal URL', type: 'url', required: true, example: 'https://petmayday.org/training' },
      { name: 'handbookUrl', description: 'Handbook URL', type: 'url', required: true, example: 'https://petmayday.org/handbook' },
      { name: 'profileUrl', description: 'Profile setup URL', type: 'url', required: true, example: 'https://petmayday.org/profile' },
      { name: 'communityUrl', description: 'Community URL', type: 'url', required: false, defaultValue: 'https://petmayday.org/community', example: 'https://petmayday.org/community' },
      { name: 'mentorName', description: 'Mentor name', type: 'string', required: true, example: 'John Smith' },
      { name: 'mentorEmail', description: 'Mentor email', type: 'email', required: true, example: 'john@petmayday.org' },
      { name: 'trainingModules', description: 'List of training modules', type: 'string', required: true, example: '- Safety Basics\n- Transport Procedures\n- Animal Handling' },
    ],
    requiredVariables: ['volunteerName', 'roleName', 'regionName', 'startDate', 'trainingUrl', 'handbookUrl', 'profileUrl', 'mentorName', 'mentorEmail', 'trainingModules'],
    version: '1.0',
    isActive: true,
    isDefault: true,
    sensitivity: 'internal',
    locale: 'en-US',
  },
];

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE MANAGER
// ═══════════════════════════════════════════════════════════════════

export class TemplateManager {
  private templates: Map<string, MessageTemplate> = new Map();
  
  constructor() {
    // Initialize with standard templates
    for (const template of STANDARD_TEMPLATES) {
      const now = new Date().toISOString();
      const fullTemplate: MessageTemplate = {
        ...template,
        id: crypto.randomUUID(),
        usageCount: 0,
        audit: {
          createdAt: now,
          createdBy: 'system' as UserId,
          version: 1,
        },
      };
      this.templates.set(template.name, fullTemplate);
    }
  }
  
  /**
   * Get template by name
   */
  getTemplate(name: string): MessageTemplate | undefined {
    return this.templates.get(name);
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): MessageTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }
  
  /**
   * Get templates by channel
   */
  getTemplatesByChannel(channel: TemplateChannel): MessageTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.channels.includes(channel));
  }
  
  /**
   * Render template with variables
   */
  renderTemplate(
    templateName: string,
    variables: Record<string, string | number | boolean>,
    options?: {
      channel?: TemplateChannel;
      locale?: string;
    }
  ): RenderedMessage {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    // Validate required variables
    const missingVars = template.requiredVariables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }
    
    // Apply default values
    const allVariables: Record<string, string> = {};
    for (const varDef of template.variables) {
      if (varDef.name in variables) {
        allVariables[varDef.name] = String(variables[varDef.name]);
      } else if (varDef.defaultValue) {
        allVariables[varDef.name] = varDef.defaultValue;
      }
    }
    
    // Get localized content if available
    const locale = options?.locale ?? template.locale;
    const content = template.translations?.[locale] ?? {
      subject: template.subject,
      body: template.body,
      bodyHtml: template.bodyHtml,
      shortBody: template.shortBody,
    };
    
    // Render content
    const renderedSubject = content.subject ? this.interpolate(content.subject, allVariables) : undefined;
    const renderedBody = this.interpolate(content.body, allVariables);
    const renderedBodyHtml = content.bodyHtml ? this.interpolate(content.bodyHtml, allVariables) : undefined;
    const renderedShortBody = content.shortBody ? this.interpolate(content.shortBody, allVariables) : undefined;
    
    // Select appropriate body based on channel
    let finalBody = renderedBody;
    if (options?.channel === 'sms' && renderedShortBody) {
      finalBody = renderedShortBody;
    }
    
    return {
      templateId: template.id,
      templateName: template.name,
      subject: renderedSubject,
      body: finalBody,
      bodyHtml: renderedBodyHtml,
      shortBody: renderedShortBody,
      channel: options?.channel,
      locale,
      renderedAt: new Date().toISOString(),
      variablesUsed: allVariables,
    };
  }
  
  /**
   * Validate variables against template
   */
  validateVariables(
    templateName: string,
    variables: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateName);
    if (!template) {
      return { valid: false, errors: [`Template not found: ${templateName}`] };
    }
    
    const errors: string[] = [];
    
    // Check required variables
    for (const required of template.requiredVariables) {
      if (!(required in variables) || variables[required] === undefined || variables[required] === '') {
        errors.push(`Missing required variable: ${required}`);
      }
    }
    
    // Validate types
    for (const varDef of template.variables) {
      if (varDef.name in variables) {
        const value = variables[varDef.name];
        
        switch (varDef.type) {
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`Variable ${varDef.name} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && !['true', 'false'].includes(String(value).toLowerCase())) {
              errors.push(`Variable ${varDef.name} must be a boolean`);
            }
            break;
          case 'email':
            if (typeof value === 'string' && !value.includes('@')) {
              errors.push(`Variable ${varDef.name} must be a valid email`);
            }
            break;
          case 'url':
            if (typeof value === 'string' && !value.startsWith('http')) {
              errors.push(`Variable ${varDef.name} must be a valid URL`);
            }
            break;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Simple variable interpolation
   */
  private interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] ?? match;
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// RENDERED MESSAGE
// ═══════════════════════════════════════════════════════════════════

export interface RenderedMessage {
  templateId: string;
  templateName: string;
  subject?: string;
  body: string;
  bodyHtml?: string;
  shortBody?: string;
  channel?: TemplateChannel;
  locale: string;
  renderedAt: string;
  variablesUsed: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export const templateManager = new TemplateManager();

export function getTemplateForChannel(
  templateName: string,
  channel: TemplateChannel
): MessageTemplate | undefined {
  const template = templateManager.getTemplate(templateName);
  if (!template) return undefined;
  
  if (!template.channels.includes(channel)) {
    return undefined;
  }
  
  return template;
}

export function listActiveTemplates(): MessageTemplate[] {
  const templates: MessageTemplate[] = [];
  
  for (const category of ['case_update', 'verification', 'dispatch', 'volunteer', 'safety', 'system'] as TemplateCategory[]) {
    templates.push(...templateManager.getTemplatesByCategory(category).filter(t => t.isActive));
  }
  
  return templates;
}

export function renderQuickMessage(
  templateName: string,
  variables: Record<string, string | number | boolean>,
  channel: TemplateChannel = 'email'
): string {
  const rendered = templateManager.renderTemplate(templateName, variables, { channel });
  return rendered.body;
}
