import type { AccessibilityMetadata, ContentItem, ContentType, Percentage } from './petmayday-training-system-v2-part1-types';

export type AccessibilitySeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AccessibilityFinding {
  id: string;
  severity: AccessibilitySeverity;
  title: string;
  description: string;
  wcagReference?: string;
}

export interface AccessibilityChecklistItem {
  id: string;
  section: string;
  requirement: string;
  standard?: string;
  mustPass: boolean;
}

export const TRAINING_CONTENT_ACCESSIBILITY_CHECKLIST: AccessibilityChecklistItem[] = [
  { id: 'text_contrast', section: 'Text Content', requirement: 'Text meets 4.5:1 contrast ratio against background', standard: 'WCAG 1.4.3', mustPass: true },
  { id: 'text_resize', section: 'Text Content', requirement: 'Readable at 200% zoom', standard: 'WCAG 1.4.4', mustPass: true },
  { id: 'alt_text', section: 'Images & Graphics', requirement: 'All images have meaningful alt text (decorative images use empty alt)', standard: 'WCAG 1.1.1', mustPass: true },
  { id: 'keyboard_access', section: 'Interactive Content', requirement: 'All functions usable via keyboard; focus visible; no keyboard traps', standard: 'WCAG 2.1.1 / 2.4.7', mustPass: true },
  { id: 'captions', section: 'Video Content', requirement: 'All videos have synchronized closed captions', standard: 'WCAG 1.2.2', mustPass: true },
  { id: 'labels', section: 'Interactive Content', requirement: 'All form inputs have associated labels and errors are described', standard: 'WCAG 1.3.1 / 3.3.1', mustPass: true },
  { id: 'page_titles', section: 'Navigation & Layout', requirement: 'Each page has unique descriptive title and language is declared', standard: 'WCAG 2.4.2 / 3.1.1', mustPass: true },
  { id: 'reading_level', section: 'Text Content', requirement: 'Reading level at or below 8th grade (Flesch-Kincaid <= 8)', standard: 'WCAG 3.1.5', mustPass: false },
  { id: 'transcripts', section: 'Video Content', requirement: 'Full transcript available for audio/video', standard: 'WCAG 1.2.1', mustPass: false },
  { id: 'audio_description', section: 'Video Content', requirement: 'Audio description track provided when visuals convey essential info', standard: 'WCAG 1.2.5', mustPass: false },
];

export function validateAccessibilityMetadata(metadata: AccessibilityMetadata | undefined): AccessibilityFinding[] {
  const findings: AccessibilityFinding[] = [];

  if (!metadata) {
    findings.push({
      id: 'missing_accessibility_metadata',
      severity: 'CRITICAL',
      title: 'Missing accessibility metadata',
      description: 'Content item must include AccessibilityMetadata to pass publication gate.',
    });
    return findings;
  }

  if (!metadata.wcagLevel) {
    findings.push({
      id: 'missing_wcag_level',
      severity: 'CRITICAL',
      title: 'Missing WCAG level',
      description: 'wcagLevel must be set to A, AA, or AAA.',
    });
  } else if (metadata.wcagLevel === 'A') {
    findings.push({
      id: 'wcag_below_aa',
      severity: 'CRITICAL',
      title: 'WCAG level below AA',
      description: 'Training content must meet WCAG 2.1 AA before publication.',
      wcagReference: 'WCAG 2.1 AA',
    });
  }

  if (metadata.colorContrastRatio < 4.5) {
    findings.push({
      id: 'contrast_ratio_low',
      severity: 'CRITICAL',
      title: 'Insufficient color contrast',
      description: `colorContrastRatio must be >= 4.5:1. Current: ${metadata.colorContrastRatio}.`,
      wcagReference: 'WCAG 1.4.3',
    });
  }

  if (!metadata.keyboardNavigable) {
    findings.push({
      id: 'not_keyboard_navigable',
      severity: 'CRITICAL',
      title: 'Not keyboard navigable',
      description: 'All interactive content must be keyboard navigable.',
      wcagReference: 'WCAG 2.1.1',
    });
  }

  if (!metadata.ariaLabelsComplete) {
    findings.push({
      id: 'aria_labels_incomplete',
      severity: 'CRITICAL',
      title: 'ARIA labels incomplete',
      description: 'ariaLabelsComplete must be true for screen reader compatibility.',
      wcagReference: 'WCAG 4.1.2',
    });
  }

  if (!metadata.headingStructureValid) {
    findings.push({
      id: 'heading_structure_invalid',
      severity: 'WARNING',
      title: 'Heading structure may be invalid',
      description: 'headingStructureValid should be true to support screen reader navigation.',
      wcagReference: 'WCAG 1.3.1',
    });
  }

  if (!metadata.tabOrderLogical) {
    findings.push({
      id: 'tab_order_not_logical',
      severity: 'CRITICAL',
      title: 'Tab order not logical',
      description: 'tabOrderLogical must be true so keyboard users can navigate in reading order.',
      wcagReference: 'WCAG 2.4.3',
    });
  }

  if (metadata.usesColorAloneForMeaning) {
    findings.push({
      id: 'color_alone',
      severity: 'CRITICAL',
      title: 'Color used as the sole indicator',
      description: 'Information must not be conveyed by color alone.',
      wcagReference: 'WCAG 1.4.1',
    });
  }

  if (!metadata.noFlashingContent && (metadata.flashesPerSecond ?? 0) >= 3) {
    findings.push({
      id: 'flashing_content',
      severity: 'CRITICAL',
      title: 'Flashing content risk',
      description: 'Content must not flash more than 3 times per second.',
      wcagReference: 'WCAG 2.3.1',
    });
  }

  if (!metadata.minimumTouchTargetSize || metadata.minimumTouchTargetSize < 44) {
    findings.push({
      id: 'touch_target_small',
      severity: 'WARNING',
      title: 'Touch targets may be too small',
      description: 'Recommended minimum touch target size is 44x44px.',
    });
  }

  if (metadata.fleschKincaidGrade > 8) {
    findings.push({
      id: 'reading_level_high',
      severity: 'WARNING',
      title: 'Reading level above target',
      description: `Target is Flesch-Kincaid grade <= 8. Current: ${metadata.fleschKincaidGrade}.`,
      wcagReference: 'WCAG 3.1.5',
    });
  }

  return findings;
}

export function validateContentItemAccessibility(item: ContentItem): AccessibilityFinding[] {
  const findings = [...validateAccessibilityMetadata(item.accessibility)];

  const type: ContentType = item.type;

  if (type === 'VIDEO') {
    if (!item.accessibility.hasClosedCaptions) {
      findings.push({
        id: 'video_missing_captions',
        severity: 'CRITICAL',
        title: 'Video missing closed captions',
        description: 'All videos must include synchronized closed captions before publication.',
        wcagReference: 'WCAG 1.2.2',
      });
    }

    if (!item.accessibility.hasTranscript) {
      findings.push({
        id: 'video_missing_transcript',
        severity: 'WARNING',
        title: 'Video missing transcript',
        description: 'Provide a complete transcript (recommended).',
        wcagReference: 'WCAG 1.2.1',
      });
    }
  }

  if (type === 'INFOGRAPHIC') {
    if (!item.accessibility.hasAltTextForImages) {
      findings.push({
        id: 'infographic_missing_alt',
        severity: 'CRITICAL',
        title: 'Infographic missing alt text',
        description: 'Infographics require alt text and often an extended description.',
        wcagReference: 'WCAG 1.1.1',
      });
    }
  }

  if (item.contentUrl && item.downloadable && typeof item.downloadSize !== 'number') {
    findings.push({
      id: 'download_size_missing',
      severity: 'WARNING',
      title: 'Download size not specified',
      description: 'Large downloads should indicate file size.',
    });
  }

  return findings;
}

export function canPublishContentItem(item: ContentItem): { canPublish: boolean; findings: AccessibilityFinding[] } {
  const findings = validateContentItemAccessibility(item);
  const canPublish = findings.every(f => f.severity !== 'CRITICAL');
  return { canPublish, findings };
}

export function summarizeFindings(findings: AccessibilityFinding[]): { critical: number; warning: number; info: number } {
  return {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    warning: findings.filter(f => f.severity === 'WARNING').length,
    info: findings.filter(f => f.severity === 'INFO').length,
  };
}

export function estimateReadingLevelCompliance(metadata: AccessibilityMetadata | undefined): Percentage {
  if (!metadata) return 0 as Percentage;
  if (metadata.fleschKincaidGrade <= 8) return 100 as Percentage;
  if (metadata.fleschKincaidGrade >= 12) return 0 as Percentage;
  const delta = metadata.fleschKincaidGrade - 8;
  return Math.max(0, Math.round(100 - delta * 25)) as Percentage;
}
