'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, AlertTriangle,
  MapPin, RefreshCcw, Clock, Car, Navigation
} from 'lucide-react';

// Types
type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
type AlertSeverity = 'advisory' | 'watch' | 'warning';

type CountyWeather = {
  county: string;
  condition: WeatherCondition;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  alerts: WeatherAlert[];
  roadConditions: 'clear' | 'wet' | 'icy' | 'snow_covered' | 'flooded';
  transportSafe: boolean;
};

type WeatherAlert = {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  expires: string;
  counties: string[];
};

// Mock weather data for WV counties
const MOCK_WEATHER: CountyWeather[] = [
  { county: 'Kanawha', condition: 'cloudy', temp: 38, feelsLike: 32, humidity: 65, windSpeed: 12, windDirection: 'NW', visibility: 8, alerts: [], roadConditions: 'wet', transportSafe: true },
  { county: 'Cabell', condition: 'rain', temp: 41, feelsLike: 36, humidity: 80, windSpeed: 8, windDirection: 'W', visibility: 5, alerts: [], roadConditions: 'wet', transportSafe: true },
  { county: 'Greenbrier', condition: 'snow', temp: 28, feelsLike: 18, humidity: 75, windSpeed: 18, windDirection: 'NW', visibility: 2, alerts: [], roadConditions: 'snow_covered', transportSafe: false },
  { county: 'Berkeley', condition: 'clear', temp: 42, feelsLike: 38, humidity: 55, windSpeed: 6, windDirection: 'S', visibility: 10, alerts: [], roadConditions: 'clear', transportSafe: true },
  { county: 'Monongalia', condition: 'cloudy', temp: 35, feelsLike: 28, humidity: 70, windSpeed: 15, windDirection: 'N', visibility: 7, alerts: [], roadConditions: 'wet', transportSafe: true },
  { county: 'Raleigh', condition: 'snow', temp: 30, feelsLike: 22, humidity: 72, windSpeed: 14, windDirection: 'NW', visibility: 3, alerts: [], roadConditions: 'icy', transportSafe: false },
  { county: 'Wood', condition: 'rain', temp: 39, feelsLike: 33, humidity: 78, windSpeed: 10, windDirection: 'W', visibility: 6, alerts: [], roadConditions: 'wet', transportSafe: true },
  { county: 'Harrison', condition: 'cloudy', temp: 36, feelsLike: 30, humidity: 68, windSpeed: 11, windDirection: 'NW', visibility: 8, alerts: [], roadConditions: 'wet', transportSafe: true },
];

const ACTIVE_ALERTS: WeatherAlert[] = [
  { id: 'A1', type: 'WINTER_STORM', severity: 'warning', title: 'Winter Storm Warning', description: 'Heavy snow expected. 6-10 inches accumulation. Travel not recommended.', expires: '2026-01-14 06:00', counties: ['Greenbrier', 'Pocahontas', 'Webster'] },
  { id: 'A2', type: 'WIND_ADVISORY', severity: 'advisory', title: 'Wind Advisory', description: 'Gusts up to 45 mph possible. Secure loose objects.', expires: '2026-01-13 18:00', counties: ['Monongalia', 'Preston', 'Tucker'] },
  { id: 'A3', type: 'FREEZE', severity: 'watch', title: 'Freeze Watch', description: 'Sub-freezing temperatures expected overnight. Protect pets and pipes.', expires: '2026-01-14 10:00', counties: ['Raleigh', 'Fayette', 'Nicholas'] },
];

const CONDITION_ICONS: Record<WeatherCondition, typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudRain,
  fog: Cloud,
};

const CONDITION_COLORS: Record<WeatherCondition, string> = {
  clear: 'text-amber-400',
  cloudy: 'text-zinc-400',
  rain: 'text-blue-400',
  snow: 'text-cyan-300',
  storm: 'text-purple-400',
  fog: 'text-zinc-500',
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  advisory: 'bg-blue-900/50 text-blue-300 border-blue-800',
  watch: 'bg-amber-900/50 text-amber-300 border-amber-800',
  warning: 'bg-red-900/50 text-red-300 border-red-800',
};

const ROAD_COLORS: Record<string, string> = {
  clear: 'text-green-400',
  wet: 'text-blue-400',
  icy: 'text-red-400',
  snow_covered: 'text-cyan-300',
  flooded: 'text-purple-400',
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<CountyWeather[]>(MOCK_WEATHER);
  const [alerts, setAlerts] = useState<WeatherAlert[]>(ACTIVE_ALERTS);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Add alerts to weather data
  useEffect(() => {
    const weatherWithAlerts = MOCK_WEATHER.map(w => ({
      ...w,
      alerts: alerts.filter(a => a.counties.includes(w.county))
    }));
    setWeather(weatherWithAlerts);
  }, [alerts]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1000);
  };

  // Stats
  const unsafeCounties = weather.filter(w => !w.transportSafe).length;
  const activeAlertCount = alerts.length;
  const avgTemp = Math.round(weather.reduce((sum, w) => sum + w.temp, 0) / weather.length);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 text-sm mb-4">
            <Link href="/admin/mods" className="text-blue-400 hover:text-blue-300 font-medium">← Command Center</Link>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Weather & Conditions</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-400" />
                Weather & Road Conditions
              </h1>
              <p className="text-zinc-400 text-sm">Real-time weather affecting transport operations</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                <Clock className="w-3 h-3 inline mr-1" />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-zinc-900/30 border-b border-zinc-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-medium">{avgTemp}°F</span>
            <span className="text-zinc-500">Avg Temp</span>
          </div>
          {activeAlertCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">{activeAlertCount}</span>
              <span className="text-zinc-500">Active Alerts</span>
            </div>
          )}
          {unsafeCounties > 0 && (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-medium">{unsafeCounties}</span>
              <span className="text-zinc-500">Counties Unsafe for Transport</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Active Weather Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border ${SEVERITY_COLORS[alert.severity]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={SEVERITY_COLORS[alert.severity]}>{alert.severity.toUpperCase()}</Badge>
                        <span className="font-medium">{alert.title}</span>
                      </div>
                      <p className="text-sm opacity-80 mb-2">{alert.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {alert.counties.map(c => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-right opacity-70">
                      Expires: {alert.expires}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* County Weather Grid */}
        <h2 className="text-lg font-semibold mb-3">County Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {weather.map(w => {
            const ConditionIcon = CONDITION_ICONS[w.condition];
            return (
              <Card key={w.county} className={`bg-zinc-900/50 border-zinc-800 ${!w.transportSafe ? 'border-red-800/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {w.county}
                      </div>
                      {w.alerts.length > 0 && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          {w.alerts.length} Alert{w.alerts.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <ConditionIcon className={`w-8 h-8 ${CONDITION_COLORS[w.condition]}`} />
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold">{w.temp}°</span>
                    <span className="text-sm text-zinc-500">Feels {w.feelsLike}°</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" /> {w.windSpeed} mph {w.windDirection}
                    </div>
                    <div>Humidity: {w.humidity}%</div>
                    <div>Visibility: {w.visibility} mi</div>
                    <div className={ROAD_COLORS[w.roadConditions]}>
                      <Car className="w-3 h-3 inline mr-1" />
                      {w.roadConditions.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className={`mt-3 pt-3 border-t border-zinc-800 text-sm font-medium flex items-center gap-1 ${w.transportSafe ? 'text-green-400' : 'text-red-400'}`}>
                    <Navigation className="w-4 h-4" />
                    {w.transportSafe ? 'Transport OK' : 'Transport Not Recommended'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Temperature Guidelines */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-400" />
              Transport Temperature Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/50">
                <div className="font-medium text-red-400 mb-1">🔴 Too Cold (&lt;32°F)</div>
                <p className="text-xs text-zinc-400">Short trips only with heated vehicle. Extra blankets required. Monitor animals closely.</p>
              </div>
              <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/50">
                <div className="font-medium text-green-400 mb-1">🟢 Ideal (32-85°F)</div>
                <p className="text-xs text-zinc-400">Normal transport conditions. Standard precautions apply.</p>
              </div>
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/50">
                <div className="font-medium text-red-400 mb-1">🔴 Too Hot (&gt;85°F)</div>
                <p className="text-xs text-zinc-400">A/C required. Never leave animals in vehicle. Provide water. Limit trip duration.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
