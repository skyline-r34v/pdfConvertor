import { generatePDF } from '../services/pdfService.js';

export const createPDF = async (req, res, next) => {
  try {
    const { conversation, selectedMessageIds } = req.body;

    if (!conversation || !selectedMessageIds) {
      return res.status(400).json({
        success: false,
        error: 'Conversation data and selected message IDs are required'
      });
    }

    if (!Array.isArray(selectedMessageIds) || selectedMessageIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one message must be selected'
      });
    }

    const pdfBuffer = await generatePDF(conversation, selectedMessageIds);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="chatgpt-conversation-${Date.now()}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    next(error);
  }
};
