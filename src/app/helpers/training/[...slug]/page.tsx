'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, BookOpen, Video, FileText, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const CONTENT_ICONS = {
  VIDEO: Video,
  READING: FileText,
  INTERACTIVE: HelpCircle,
  SCENARIO: HelpCircle,
  DOCUMENT: FileText,
};

const CONTENT_DESCRIPTIONS: Record<string, string> = {
  'vol101/mission': 'Learn about our mission to reunite pets with their families.',
  'vol101/lost-pet-crisis': 'Understand the scope and impact of the lost pet crisis.',
  'vol101/success-stories': 'Read heartwarming reunification stories from our volunteers.',
  'vol101/platform-tour': 'Take a tour of the Pet911 website and mobile app.',
  'vol101/platform-walkthrough': 'Hands-on practice navigating key platform features.',
  'vol101/case-lifecycle': 'How cases move through our system from report to resolution.',
  'vol101/volunteer-roles': 'Overview of all volunteer positions and responsibilities.',
  'vol101/code-of-conduct': 'Values and principles guiding our volunteer community.',
  'vol101/code-of-conduct-full': 'Complete code of conduct document for reference.',
  'vol101/personal-safety': 'How to stay safe during volunteer activities.',
  'vol101/safety-scenarios': 'Interactive scenarios to practice safety decision-making.',
  'vol101/mandatory-reporting': 'When and how to report animal abuse, neglect, or dangerous situations.',
  'vol101/empathetic-communication': 'Connecting with people experiencing the stress of a lost pet.',
  'vol101/communication-templates': 'Standard messages and best practices for volunteer communication.',
  'vol101/difficult-conversations': 'Interactive scenarios for challenging conversations.',
  'mod101/code-of-conduct': 'Moderator-specific code of conduct and enforcement outcomes.',
  'mod110/case-triage': 'SOP for new case triage and documentation.',
  'mod120/match-verification': 'SOP for match verification and decision documentation.',
  'trn101/vehicle-setup': 'How to prepare your car for safe, comfortable pet transport.',
  'trn101/equipment-checklist': 'Complete list of required and recommended transport equipment.',
  'trn101/pretransport-check': 'Practice completing the pre-transport safety check.',
  'trn101/pickup-process': 'Step-by-step guide to picking up a pet safely.',
  'trn101/documentation': 'How to document the pet and verify identity during pickup.',
};

export default function TrainingContentPage() {
  const params = useParams();
  const router = useRouter();
  const contentPath = Array.isArray(params.slug) ? params.slug.join('/') : (params.slug as string);

  const description = CONTENT_DESCRIPTIONS[contentPath] || 'Training content for this module.';
  const Icon = CONTENT_ICONS['READING'] as any; // Default to reading icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Module
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="w-6 h-6 text-blue-600" />
                {contentPath.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Training Content'}
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                <Clock className="w-3 h-3 mr-1" />
                Self-paced
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">{description}</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Content Placeholder</h3>
                <p className="text-sm text-slate-600 mb-4">
                  This is a placeholder for the actual training content. In production, this would contain:
                </p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Video lessons or interactive modules</li>
                  <li>Downloadable resources and checklists</li>
                  <li>Knowledge checks and quizzes</li>
                  <li>Case studies and scenarios</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.back()} variant="outline">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Back to Module
                </Button>
                <Link href="/helpers/training">
                  <Button variant="ghost">
                    All Training
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
