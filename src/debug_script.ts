
import { generateCompanionResponse } from './lib/ai/counselor-engine';

const input = "I know it's silly to be this upset over just a dog";
const result = generateCompanionResponse(input);
console.log('Category:', result.analysis.category);
console.log('Response:', result.response);
console.log('Markers:', result.analysis.detectedMarkers);
