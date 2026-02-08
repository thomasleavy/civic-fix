import { Router } from 'express';
import { getWeatherByCounty } from '../controllers/weatherController';

const router = Router();

// Public route - anyone can view weather
router.get('/', getWeatherByCounty);

export default router;
