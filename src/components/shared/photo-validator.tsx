'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Upload,
  RefreshCw,
  Info
} from 'lucide-react';

interface PhotoValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

interface PhotoValidatorProps {
  onPhotosValidated: (photos: string[], validations: PhotoValidationResult[]) => void;
  maxPhotos?: number;
  context: 'missing' | 'found';
}

export function PhotoValidator({ onPhotosValidated, maxPhotos = 5, context }: PhotoValidatorProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [validations, setValidations] = useState<PhotoValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Simulate photo validation (in real app, this would use AI/ML)
  const validatePhoto = useCallback(async (photoUrl: string): Promise<PhotoValidationResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation results
    const random = Math.random();
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (random < 0.3) {
      issues.push('Image is too blurry');
      suggestions.push('Take photo in better lighting');
    }
    if (random < 0.4) {
      issues.push('Animal face not clearly visible');
      suggestions.push('Get closer to the animal\'s face');
    }
    if (random < 0.5) {
      issues.push('Poor lighting - shadows obscure features');
      suggestions.push('Use natural daylight or move to brighter area');
    }
    if (random < 0.6) {
      suggestions.push('Include a side view of the full body');
    }
    if (random < 0.7) {
      suggestions.push('Add a photo showing any unique markings');
    }

    const score = Math.max(0, 100 - (issues.length * 20) - (suggestions.length * 5));

    return {
      isValid: issues.length === 0,
      score,
      issues,
      suggestions
    };
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photos.length + files.length > maxPhotos) {
      alert(`You can only upload up to ${maxPhotos} photos`);
      return;
    }

    setIsValidating(true);
    const newPhotos: string[] = [];
    const newValidations: PhotoValidationResult[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
      
      const validation = await validatePhoto(url);
      newValidations.push(validation);
    }

    const allPhotos = [...photos, ...newPhotos];
    const allValidations = [...validations, ...newValidations];
    
    setPhotos(allPhotos);
    setValidations(allValidations);
    setIsValidating(false);
    
    onPhotosValidated(allPhotos, allValidations);
  }, [photos, validations, maxPhotos, validatePhoto, onPhotosValidated]);

  const removePhoto = useCallback((index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newValidations = validations.filter((_, i) => i !== index);
    
    setPhotos(newPhotos);
    setValidations(newValidations);
    
    onPhotosValidated(newPhotos, newValidations);
  }, [photos, validations, onPhotosValidated]);

  const retakePhoto = useCallback(async (index: number) => {
    // Trigger file input for retake
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const validation = await validatePhoto(url);
        
        const newPhotos = [...photos];
        const newValidations = [...validations];
        
        newPhotos[index] = url;
        newValidations[index] = validation;
        
        setPhotos(newPhotos);
        setValidations(newValidations);
        
        onPhotosValidated(newPhotos, newValidations);
      }
    };
    input.click();
  }, [photos, validations, validatePhoto, onPhotosValidated]);

  const allValid = validations.length > 0 && validations.every(v => v.isValid);
  const averageScore = validations.length > 0 
    ? validations.reduce((sum, v) => sum + v.score, 0) / validations.length 
    : 0;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isValidating}
          />
          <label htmlFor="photo-upload">
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 h-24"
              disabled={isValidating}
            >
              <div className="flex flex-col items-center gap-2">
                {isValidating ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
                <span>
                  {isValidating ? 'Validating...' : `Upload Photos (${photos.length}/${maxPhotos})`}
                </span>
                <span className="text-xs text-gray-500">
                  JPG, PNG up to 10MB each
                </span>
              </div>
            </Button>
          </label>
        </div>
      )}

      {/* Validation Summary */}
      {validations.length > 0 && (
        <Card className={allValid ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {allValid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                )}
                <span className="font-medium">
                  {allValid ? 'All photos meet quality standards' : 'Some photos need improvement'}
                </span>
              </div>
              <Badge variant={allValid ? 'success' : 'warning'}>
                {Math.round(averageScore)}% Quality
              </Badge>
            </div>
            <Progress value={averageScore} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge 
                  variant={validations[index]?.isValid ? 'success' : 'warning'}
                  className="text-xs"
                >
                  {validations[index]?.score || 0}%
                </Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Validation Issues */}
                {validations[index]?.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700">{issue}</span>
                  </div>
                ))}
                
                {/* Suggestions */}
                {validations[index]?.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Info className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-700">{suggestion}</span>
                  </div>
                ))}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retakePhoto(index)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retake
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removePhoto(index)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Requirements */}
      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          <strong>Photo Requirements:</strong> Clear, in-focus photos showing the animal's face 
          and full body. Natural lighting works best. Photos with people, filters, or poor 
          lighting may be rejected.
        </AlertDescription>
      </Alert>
    </div>
  );
}
