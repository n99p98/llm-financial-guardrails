'use strict';

// Replace this with a real Bedrock call in production.
// This mock intentionally echoes parts of the prompt to demonstrate why post-check matters.

async function generateText(prompt) {
  // very small delay to mimic network
  await new Promise(r => setTimeout(r, 30));

  // naive echo to demonstrate possible leakage
  return `Draft email:\n\nThank you for your request. ${prompt}\n\nRegards,\nSales Team`;
}

module.exports = { generateText };
