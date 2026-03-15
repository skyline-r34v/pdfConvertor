import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { log } from '../utils/logger.js';

export const generatePDF = async (conversation, selectedMessageIds) => {
  let browser = null;

  try {
    log.info(`Generating PDF notes for ${selectedMessageIds.length} messages`);

    const selectedMessages = conversation.messages.filter(msg =>
      selectedMessageIds.includes(msg.id)
    );

    if (selectedMessages.length === 0) {
      throw new Error('No messages selected for PDF generation');
    }

    const htmlContent = generateWordStyleHTMLContent(conversation.title, selectedMessages);

   browser = await puppeteer.launch({
      headless: chromium.headless,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      ignoreDefaultArgs: ['--disable-extensions']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `
    <div style="font-size: 9px; font-family: Calibri,Arial; width: 100%; text-align: center; color: #666; padding: 0 20px;">
      ${conversation.title}
    </div>
  `,
      footerTemplate: `
    <div style="font-size: 9px; font-family: Calibri,Arial; width: 100%; text-align: center; color: #666; padding: 0 20px;">
      Page <span class="pageNumber"></span> of <span class="totalPages"></span>
    </div>
  `,
      margin: {
        top: '25mm',      // ← Fixed proper margin
        right: '20mm',    // ← Fixed proper margin
        bottom: '25mm',   // ← Fixed proper margin
        left: '20mm'      // ← Fixed proper margin
      }
    });


    log.info('PDF notes generated successfully');
    return pdfBuffer;

  } catch (error) {
    log.error(`PDF generation failed: ${error.message}`);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateWordStyleHTMLContent = (title, messages) => {
  const sections = createNoteSections(messages);

  const sectionsHTML = sections.map((section, index) => {
    return `
      <div class="section">
        ${section.question ? `
          <h2 class="question">Q${index + 1}. ${formatContent(section.question.content)}</h2>
        ` : ''}
        
        ${section.answer ? `
          <div class="answer">
            ${formatContent(section.answer.content)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
     <style>
  @page { 
    margin: 25mm 20mm 25mm 20mm;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.15;
    color: #000;
    background: #fff;
    padding: 0;
  }

  /* Title */
  .doc-title {
    font-size: 16pt;
    font-weight: 700;
    color: #000;
    text-align: center;
    margin-bottom: 8pt;
    padding-bottom: 4pt;
    border-bottom: 1pt solid #000;
  }

  .doc-meta {
    text-align: center;
    font-size: 9pt;
    color: #555;
    margin-bottom: 16pt;
  }

  /* Sections - COMPACT */
  .section {
    margin-bottom: 10pt;
    page-break-inside: avoid;
  }

  /* Questions - TIGHT */
  .question {
    font-size: 11pt;
    font-weight: 700;
    color: #000;
    margin: 0 0 5pt 0;
    line-height: 1.2;
    page-break-after: avoid;
  }

  /* Answers - COMPACT */
  .answer {
    font-size: 11pt;
    line-height: 1.2;
    color: #000;
    margin-bottom: 8pt;
  }

  /* Paragraphs */
  p {
    margin: 0 0 5pt 0;
    text-align: justify;
  }

  p:last-child {
    margin-bottom: 0;
  }

  /* Headings */
  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #000;
    margin: 8pt 0 4pt 0;
  }

  h4 {
    font-size: 11pt;
    font-weight: 700;
    color: #000;
    margin: 6pt 0 3pt 0;
  }

  /* Typography */
  strong, b {
    font-weight: 700;
  }

  em, i {
    font-style: italic;
  }

  /* Lists */
  ul, ol {
    margin: 4pt 0 4pt 20pt;
    padding: 0;
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  li {
    margin-bottom: 2pt;
    line-height: 1.2;
  }

  li:last-child {
    margin-bottom: 0;
  }

  ul ul {
    list-style-type: circle;
    margin-top: 2pt;
  }

  ol ol, ul ol {
    list-style-type: lower-alpha;
    margin-top: 2pt;
  }

  /* Code Blocks */
  .code-block {
    background: #f5f5f5;
    border-left: 2pt solid #666;
    padding: 8pt 10pt;
    margin: 6pt 0;
    font-family: Consolas, 'Courier New', monospace;
    font-size: 9pt;
    line-height: 1.3;
    overflow-x: auto;
    page-break-inside: avoid;
  }

  /* Inline Code */
  code {
    background: #f5f5f5;
    color: #c7254e;
    padding: 1pt 4pt;
    font-family: Consolas, monospace;
    font-size: 9pt;
    border: 1pt solid #ddd;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6pt 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }

  th {
    background: #d9d9d9;
    color: #000;
    font-weight: 700;
    padding: 5pt 8pt;
    text-align: left;
    border: 1pt solid #999;
  }

  td {
    padding: 5pt 8pt;
    border: 1pt solid #ccc;
    vertical-align: top;
  }

  tr:nth-child(even) {
    background: #f9f9f9;
  }

  /* Blockquotes */
  blockquote {
    border-left: 3pt solid #999;
    padding-left: 10pt;
    margin: 6pt 0 6pt 8pt;
    font-style: italic;
    color: #555;
  }

  /* HR */
  hr {
    border: none;
    border-top: 1pt solid #ccc;
    margin: 8pt 0;
  }

  /* Links */
  a {
    color: #0066cc;
    text-decoration: underline;
  }

  /* Print */
  @media print {
    @page {
      margin: 25mm 20mm 25mm 20mm;
    }
    
    body {
      padding: 0;
    }
    
    .section {
      page-break-inside: avoid;
    }
    
    .question {
      page-break-after: avoid;
    }
  }
</style>


    </head>
    <body>
      <h1 class="doc-title">${escapeHtml(title)}</h1>
      <div class="doc-meta">
        Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | 
        ${sections.length} Section${sections.length !== 1 ? 's' : ''}
      </div>

      ${sectionsHTML}
    </body>
    </html>
  `;
};

const createNoteSections = (messages) => {
  const sections = [];
  let currentQuestion = null;

  messages.forEach(msg => {
    if (msg.role === 'user') {
      if (currentQuestion) {
        sections.push({ question: currentQuestion, answer: null });
      }
      currentQuestion = msg;
    } else if (msg.role === 'assistant') {
      sections.push({
        question: currentQuestion,
        answer: msg
      });
      currentQuestion = null;
    }
  });

  if (currentQuestion) {
    sections.push({ question: currentQuestion, answer: null });
  }

  return sections;
};

const formatContent = (content) => {
  let formatted = escapeHtml(content);

  // Convert markdown tables to HTML tables
  formatted = convertMarkdownTables(formatted);

  // Convert code blocks (```language\ncode```)
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<div class="code-block">${code.trim()}</div>`;
  });

  // Convert inline code (`code`)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert headers
  formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');

  // Convert bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Convert italic (*text* or _text_)
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');

  // Convert links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

  // Convert bullet lists (- item or * item)
  let lines = formatted.split('\n');
  let inList = false;
  let listType = null;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Detect unordered list
    if (/^[\s]*[-*]\s+(.+)/.test(line)) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${line.replace(/^[\s]*[-*]\s+/, '').trim()}</li>`);
    }
    // Detect ordered list
    else if (/^[\s]*\d+\.\s+(.+)/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${line.replace(/^[\s]*\d+\.\s+/, '').trim()}</li>`);
    }
    else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      result.push(line);
    }
  }

  if (inList) {
    result.push(`</${listType}>`);
  }

  formatted = result.join('\n');

  // Convert blockquotes (> text)
  formatted = formatted.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Convert horizontal rules (--- or ***)
  formatted = formatted.replace(/^(---|\*\*\*)$/gm, '<hr>');

  // Convert paragraphs (text separated by blank lines)
  formatted = formatted.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';

    // Don't wrap if already in HTML tag
    if (block.match(/^<(h[1-6]|ul|ol|table|div|blockquote|hr)/)) {
      return block;
    }

    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return formatted;
};

const convertMarkdownTables = (text) => {
  // Match markdown tables
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;

  return text.replace(tableRegex, (match, headerRow, bodyRows) => {
    // Parse header
    const headers = headerRow.split('|')
      .map(h => h.trim())
      .filter(h => h);

    // Parse body rows
    const rows = bodyRows.trim().split('\n')
      .map(row => {
        return row.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell);
      });

    // Generate HTML table
    let html = '<table>\n<thead>\n<tr>\n';
    headers.forEach(header => {
      html += `  <th>${header}</th>\n`;
    });
    html += '</tr>\n</thead>\n<tbody>\n';

    rows.forEach(row => {
      html += '<tr>\n';
      row.forEach(cell => {
        html += `  <td>${cell}</td>\n`;
      });
      html += '</tr>\n';
    });

    html += '</tbody>\n</table>';

    return html;
  });
};

const escapeHtml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};