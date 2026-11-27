import {
  CountryTariffConfig,
  WeatherCondition,
  WeatherState,
} from '../types/simulator';

const GOOGLE_WEATHER_ENDPOINT =
  'https://weather.googleapis.com/v1/currentConditions:lookup';

interface GoogleWeatherApiResponse {
  weatherCondition?: {
    type?: string;
    description?: {
      text?: string;
    };
  };
  temperature?: {
    degrees?: number;
  };
}

function mapGoogleConditionType(rawType?: string): WeatherCondition {
  const normalized = (rawType ?? '').toUpperCase();
  if (
    normalized.includes('THUNDER') ||
    normalized.includes('LIGHTNING') ||
    normalized.includes('STORM')
  ) {
    return 'THUNDERSTORM';
  }
  if (
    normalized.includes('HEAVY_RAIN') ||
    normalized.includes('HEAVY_SHOWERS') ||
    normalized.includes('DOWNPOUR') ||
    normalized.includes('RAIN_PERIODICALLY_HEAVY')
  ) {
    return 'HEAVY_RAIN';
  }
  return 'CLEAR';
}

export function buildPresetWeatherState(
  condition: WeatherCondition,
  country: CountryTariffConfig
): WeatherState {
  if (condition === 'THUNDERSTORM') {
    return {
      mode: 'THUNDERSTORM',
      condition: 'THUNDERSTORM',
      source: 'MANUAL_PRESET',
      city: country.city,
      ambientTempC: 26,
      description: 'Thunderstorm & lightning surge risk',
      lastUpdated: 'Simulated Preset',
      isLoading: false,
      error: null,
    };
  }
  if (condition === 'HEAVY_RAIN') {
    return {
      mode: 'HEAVY_RAIN',
      condition: 'HEAVY_RAIN',
      source: 'MANUAL_PRESET',
      city: country.city,
      ambientTempC: 27,
      description: 'Heavy rain & grid instability advisory',
      lastUpdated: 'Simulated Preset',
      isLoading: false,
      error: null,
    };
  }
  return {
    mode: 'CLEAR',
    condition: 'CLEAR',
    source: 'MANUAL_PRESET',
    city: country.city,
    ambientTempC: 29,
    description: 'Clear sky (Normal grid weather)',
    lastUpdated: 'Simulated Preset',
    isLoading: false,
    error: null,
  };
}

export function buildFallbackWeatherState(
  country: CountryTariffConfig,
  reason?: string
): WeatherState {
  return {
    mode: 'LIVE_API',
    condition: 'CLEAR',
    source: 'SIMULATED_FALLBACK',
    city: country.city,
    ambientTempC: country.code === 'ID' || country.code === 'MY' || country.code === 'SG' ? 29 : 16,
    description: 'Clear (Local Weather Fallback)',
    lastUpdated: 'Offline Fallback',
    isLoading: false,
    error: reason ?? null,
  };
}

export async function fetchLiveWeatherForCountry(
  country: CountryTariffConfig,
  signal?: AbortSignal
): Promise<WeatherState> {
  const apiKey = import.meta.env.VITE_GOOGLE_WEATHER_API_KEY?.trim();
  if (!apiKey) {
    return buildFallbackWeatherState(
      country,
      'VITE_GOOGLE_WEATHER_API_KEY not configured; using local fallback.'
    );
  }

  const url = `${GOOGLE_WEATHER_ENDPOINT}?key=${encodeURIComponent(
    apiKey
  )}&location.latitude=${country.latitude}&location.longitude=${country.longitude}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      return buildFallbackWeatherState(
        country,
        `Weather API HTTP ${response.status}; using local fallback.`
      );
    }

    const data = (await response.json()) as GoogleWeatherApiResponse;
    if (!data || typeof data !== 'object' || !data.weatherCondition) {
      return buildFallbackWeatherState(
        country,
        'Unexpected Weather API response; using local fallback.'
      );
    }

    const mappedCondition = mapGoogleConditionType(data.weatherCondition.type);
    const apiDescription =
      data.weatherCondition.description?.text?.trim() ||
      (mappedCondition === 'THUNDERSTORM'
        ? 'Thunderstorm detected'
        : mappedCondition === 'HEAVY_RAIN'
          ? 'Heavy rain detected'
          : 'Clear conditions');
    const ambientTempC =
      typeof data.temperature?.degrees === 'number' && Number.isFinite(data.temperature.degrees)
        ? Math.round(data.temperature.degrees)
        : 28;

    return {
      mode: 'LIVE_API',
      condition: mappedCondition,
      source: 'GOOGLE_API',
      city: country.city,
      ambientTempC,
      description: apiDescription,
      lastUpdated: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isLoading: false,
      error: null,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    return buildFallbackWeatherState(
      country,
      'Network unavailable; using local weather fallback.'
    );
  }
}
