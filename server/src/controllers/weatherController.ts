import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';

// County to city mapping for OpenWeather API (using main cities in each county)
const COUNTY_TO_CITY: Record<string, string> = {
  'Carlow': 'Carlow',
  'Cavan': 'Cavan',
  'Clare': 'Ennis',
  'Cork': 'Cork',
  'Donegal': 'Letterkenny',
  'Dublin': 'Dublin',
  'Galway': 'Galway',
  'Kerry': 'Tralee',
  'Kildare': 'Naas',
  'Kilkenny': 'Kilkenny',
  'Laois': 'Portlaoise',
  'Leitrim': 'Carrick-on-Shannon',
  'Limerick': 'Limerick',
  'Longford': 'Longford',
  'Louth': 'Dundalk',
  'Mayo': 'Castlebar',
  'Meath': 'Navan',
  'Monaghan': 'Monaghan',
  'Offaly': 'Tullamore',
  'Roscommon': 'Roscommon',
  'Sligo': 'Sligo',
  'Tipperary': 'Clonmel',
  'Waterford': 'Waterford',
  'Westmeath': 'Mullingar',
  'Wexford': 'Wexford',
  'Wicklow': 'Wicklow'
};

// Get weather for a specific county
export const getWeatherByCounty = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { county } = req.query;

    if (!county) {
      throw new CustomError('County parameter is required', 400, 'VALIDATION_ERROR');
    }

    // Validate county
    const validCounties = Object.keys(COUNTY_TO_CITY);
    if (!validCounties.includes(county as string)) {
      throw new CustomError('Invalid county', 400, 'VALIDATION_ERROR');
    }

    const city = COUNTY_TO_CITY[county as string];
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // Return mock data if API key is not configured
      return res.json({
        county: county as string,
        city,
        temperature: null,
        description: null,
        icon: null,
        error: 'Weather API key not configured'
      });
    }

    try {
      // Fetch weather data from OpenWeather API
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: `${city},IE`, // City, Ireland
          appid: apiKey,
          units: 'metric' // Celsius
        }
      });

      const weatherData = response.data;

      res.json({
        county: county as string,
        city,
        temperature: Math.round(weatherData.main.temp),
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind?.speed || 0
      });
    } catch (error: any) {
      // If API call fails, return error but don't crash
      console.error('OpenWeather API error:', error.response?.data || error.message);
      res.json({
        county: county as string,
        city,
        temperature: null,
        description: null,
        icon: null,
        error: 'Unable to fetch weather data'
      });
    }
  } catch (error) {
    next(error);
  }
};
