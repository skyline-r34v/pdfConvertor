export const isValidChatGPTUrl = (url) => {
  const pattern = /^https:\/\/(chat\.openai\.com\/share\/[a-zA-Z0-9-]+|chatgpt\.com\/share\/[a-zA-Z0-9-]+)/;
  return pattern.test(url);
};

export const sanitizeInput = (text) => {
  if (!text) return '';
  return text.trim();
};
