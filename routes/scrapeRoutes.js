import express from 'express';
import { scrapeFromUrl, scrapeFromText } from '../controllers/scrapeController.js';

const router = express.Router();

router.post('/url', scrapeFromUrl);
router.post('/text', scrapeFromText);

export default router;
