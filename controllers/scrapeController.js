import { scrapeChatGPTConversation, parseDirectInput } from '../services/scraperService.js';
import { isValidChatGPTUrl, sanitizeInput } from '../utils/validator.js';

export const scrapeFromUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const sanitizedUrl = sanitizeInput(url);

    if (!isValidChatGPTUrl(sanitizedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ChatGPT share URL. Please provide a valid shared conversation link.'
      });
    }

    const conversation = await scrapeChatGPTConversation(sanitizedUrl);

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    next(error);
  }
};

export const scrapeFromText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    const sanitizedText = sanitizeInput(text);

    if (sanitizedText.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content cannot be empty'
      });
    }

    const conversation = parseDirectInput(sanitizedText);

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    next(error);
  }
};
