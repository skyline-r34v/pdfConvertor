import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://gptpdf-sana.netlify.app/',
  credentials: true,
  optionsSuccessStatus: 200
};

export default cors(corsOptions);
