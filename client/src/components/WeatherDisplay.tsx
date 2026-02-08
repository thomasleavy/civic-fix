import { useQuery } from '@tanstack/react-query';
import { weatherService } from '../services/api';

interface WeatherDisplayProps {
  county: string;
  className?: string;
}

const WeatherDisplay = ({ county, className = '' }: WeatherDisplayProps) => {
  const { data: weatherData, isLoading } = useQuery({
    queryKey: ['weather', county],
    queryFn: () => weatherService.getByCounty(county),
    enabled: !!county,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  if (!county || isLoading) {
    return null;
  }

  if (!weatherData || weatherData.error || !weatherData.temperature) {
    return null; // Don't show anything if weather data is unavailable
  }

  const getWeatherEmoji = (icon: string | null) => {
    if (!icon) return '🌤️';
    // OpenWeather icon codes: 01d/01n = clear, 02d/02n = few clouds, 03d/03n = scattered clouds,
    // 04d/04n = broken clouds, 09d/09n = shower rain, 10d/10n = rain, 11d/11n = thunderstorm,
    // 13d/13n = snow, 50d/50n = mist
    if (icon.startsWith('01')) return '☀️';
    if (icon.startsWith('02')) return '⛅';
    if (icon.startsWith('03') || icon.startsWith('04')) return '☁️';
    if (icon.startsWith('09') || icon.startsWith('10')) return '🌧️';
    if (icon.startsWith('11')) return '⛈️';
    if (icon.startsWith('13')) return '❄️';
    if (icon.startsWith('50')) return '🌫️';
    return '🌤️';
  };

  const formatDescription = (desc: string | null) => {
    if (!desc) return '';
    return desc
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg">{getWeatherEmoji(weatherData.icon)}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-semibold">{weatherData.temperature}°C</span>
        {weatherData.description && (
          <span className="text-gray-600 dark:text-gray-400 ml-1">• {formatDescription(weatherData.description)}</span>
        )}
      </span>
    </div>
  );
};

export default WeatherDisplay;
