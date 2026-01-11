/**
 * Weather Service Module
 * 
 * Integrates weather data into pet search optimization.
 * Implements wind-direction travel modeling based on research.
 */

export {
  calculateDogWindBias,
  calculateCatWindBias,
  createWindAdjustedSearchArea,
  assessSearchConditions,
  fetchWeatherData,
  reportToProveniqCore,
} from './weather-service';

export type {
  WindData,
  WeatherData,
  WeatherAlert,
  WeatherConditionCategory,
  SearchImpactAssessment,
  WindTravelBias,
  EllipticalSearchArea,
} from './weather-service';
