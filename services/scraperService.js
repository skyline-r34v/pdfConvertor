import puppeteer from 'puppeteer';
import { log } from '../utils/logger.js';

export const scrapeChatGPTConversation = async (shareUrl) => {
  let browser = null;
  
  try {
    log.info(`Starting to scrape URL: ${shareUrl}`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the shared conversation
    await page.goto(shareUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for conversation to load
    await page.waitForSelector('[data-testid^="conversation-turn"]', { timeout: 30000 });

    // Extract conversation data
    const conversation = await page.evaluate(() => {
      const messages = [];
      const turnElements = document.querySelectorAll('[data-testid^="conversation-turn"]');

      turnElements.forEach((turn, index) => {
        // Determine role based on data attribute or class
        const isUser = turn.querySelector('[data-message-author-role="user"]') !== null;
        const role = isUser ? 'user' : 'assistant';

        // Get message content
        const contentElement = turn.querySelector('[data-message-author-role]');
        let content = '';

        if (contentElement) {
          // Clone the element to avoid modifying the DOM
          const clone = contentElement.cloneNode(true);
          
          // Remove any unwanted elements (buttons, etc.)
          clone.querySelectorAll('button, .copy-button, .regenerate-button').forEach(el => el.remove());
          
          // Get text content with preserved formatting
          content = clone.innerText || clone.textContent || '';
        }

        messages.push({
          id: index + 1,
          role: role,
          content: content.trim(),
          timestamp: new Date().toISOString()
        });
      });

      // Get conversation title if available
      const titleElement = document.querySelector('h1, title, [class*="title"]');
      const title = titleElement ? titleElement.textContent.trim() : 'ChatGPT Conversation';

      return {
        title: title || 'ChatGPT Conversation',
        messages: messages,
        totalMessages: messages.length,
        scrapedAt: new Date().toISOString()
      };
    });

    log.info(`Successfully scraped ${conversation.messages.length} messages`);
    return conversation;

  } catch (error) {
    log.error(`Scraping failed: ${error.message}`);
    throw new Error(`Failed to scrape conversation: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const parseDirectInput = (inputText) => {
  try {
    log.info('Parsing direct input');
    
    const lines = inputText.split('\n');
    const messages = [];
    let currentMessage = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if line starts with "User:" or "ChatGPT:" or "Assistant:"
      if (trimmedLine.startsWith('User:') || trimmedLine.toLowerCase().startsWith('you:')) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          id: messages.length + 1,
          role: 'user',
          content: trimmedLine.replace(/^(User:|You:)/i, '').trim(),
          timestamp: new Date().toISOString()
        };
      } else if (trimmedLine.startsWith('ChatGPT:') || trimmedLine.startsWith('Assistant:')) {
        if (currentMessage) {
          messages.push(currentMessage);
        }
        currentMessage = {
          id: messages.length + 1,
          role: 'assistant',
          content: trimmedLine.replace(/^(ChatGPT:|Assistant:)/i, '').trim(),
          timestamp: new Date().toISOString()
        };
      } else if (currentMessage && trimmedLine) {
        // Continue current message
        currentMessage.content += '\n' + trimmedLine;
      }
    });

    // Add last message
    if (currentMessage) {
      messages.push(currentMessage);
    }

    // If no structured format detected, treat entire input as single message
    if (messages.length === 0 && inputText.trim()) {
      messages.push({
        id: 1,
        role: 'assistant',
        content: inputText.trim(),
        timestamp: new Date().toISOString()
      });
    }

    return {
      title: 'Direct Input Conversation',
      messages: messages,
      totalMessages: messages.length,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    log.error(`Parsing failed: ${error.message}`);
    throw new Error(`Failed to parse input: ${error.message}`);
  }
};
