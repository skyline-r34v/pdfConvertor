import express from 'express';
import { createPDF } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/generate', createPDF);

export default router;
