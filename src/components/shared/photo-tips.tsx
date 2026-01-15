'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Scale,
  Eye,
  Tag,
  Maximize2
} from 'lucide-react';

interface PhotoTipsProps {
  animalType: 'dog' | 'cat' | 'other';
  context: 'missing' | 'found';
}

export function PhotoTips({ animalType, context }: PhotoTipsProps) {
  const isMissing = context === 'missing';
  const isDog = animalType === 'dog';
  const isCat = animalType === 'cat';

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Camera className="h-5 w-5" />
          Photo Guidelines for {isMissing ? `Finding Your ${animalType}` : `Documenting This ${animalType}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* General Tips */}
        <div>
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Essential Photos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <PhotoTip
              icon={<Camera className="h-4 w-4" />}
              title="Full Body - Side View"
              description="Stand to the side and capture the entire body"
              good="Shows size, shape, and overall condition"
            />
            <PhotoTip
              icon={<Eye className="h-4 w-4" />}
              title="Clear Face Shot"
              description="Get eye-level with the animal"
              good="Face and eye color are key identifiers"
            />
          </div>
        </div>

        {/* Distinguishing Features */}
        <div>
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Distinguishing Features
          </h4>
          <div className="space-y-2">
            {isDog && (
              <>
                <PhotoTip
                  icon={<Tag className="h-4 w-4" />}
                  title="Collar & Tags"
                  description="Close-up of collar, tags, or missing collar"
                  good="Tags often have contact info"
                />
                <PhotoTip
                  icon={<Maximize2 className="h-4 w-4" />}
                  title="Unique Markings"
                  description="Spots, patches, scars, or unusual patterns"
                  good={isMissing ? "Permanent markings help prove ownership" : "Permanent markings help identify the pet"}
                />
              </>
            )}
            {isCat && (
              <>
                <PhotoTip
                  icon={<Tag className="h-4 w-4" />}
                  title="Ear Tips & Face"
                  description="Show ear notches, facial markings"
                  good="Ear tips indicate TNR status"
                />
                <PhotoTip
                  icon={<Maximize2 className="h-4 w-4" />}
                  title="Paws & Tail"
                  description="Declawed paws, kinked tail, unique patterns"
                  good="These features are rarely changed"
                />
              </>
            )}
          </div>
        </div>

        {/* Size Reference */}
        <div>
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Size Reference
          </h4>
          <PhotoTip
            icon={<Scale className="h-4 w-4" />}
            title="Include Something for Scale"
            description="Place hand, coin, or object of known size next to the animal"
            good="Helps estimate size from photos"
          />
        </div>

        {/* Do's and Don'ts */}
        <div className="border-t border-blue-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Do's
              </h5>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• Use natural daylight when possible</li>
                <li>• Get at eye level with the animal</li>
                <li>• Take multiple angles</li>
                <li>• Include close-ups of unique features</li>
                <li>• Ensure photos are in focus</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Don'ts
              </h5>
              <ul className="space-y-1 text-sm text-red-700">
                <li>• No blurry or dark photos</li>
                <li>• Don't use filters</li>
                <li>• Avoid far distance shots</li>
                <li>• Don't include people in the frame</li>
                <li>• No flash reflections in eyes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Special Notes */}
        {isMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Missing Pet Tip:</strong> Include recent photos if available, 
                but also photos showing any unique features that haven't changed.
              </div>
            </div>
          </div>
        )}

        {context === 'found' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <strong>Found Animal Tip:</strong> Be careful not to get too close if the animal seems scared or aggressive. 
                Safety first!
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PhotoTipProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  good: string;
}

function PhotoTip({ icon, title, description, good }: PhotoTipProps) {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-lg border border-blue-100">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-gray-900">{title}</h5>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <p className="text-xs text-green-600 mt-1">✓ {good}</p>
      </div>
    </div>
  );
}
