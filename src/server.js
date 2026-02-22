'use strict';

const express = require('express');
const crypto = require('crypto');

const { port } = require('./config');
const { getRules } = require('./rulesCache');
const { insertAudit } = require('./db');
const { prepareRules, scanText, decideAction, applyRedactions } = require('./guardrails');
const { generateText } = require('./llmMock');

const app = express();
app.use(express.json({ limit: '1mb' }));

function makeRequestId() {
  return crypto.randomBytes(12).toString('hex');
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/generate', async (req, res) => {
  const requestId = makeRequestId();
  const industry = (req.body && req.body.industry) ? String(req.body.industry) : 'common';
  const userId = (req.body && req.body.userId) ? String(req.body.userId) : null;
  const prompt = (req.body && req.body.prompt) ? String(req.body.prompt) : '';

  if (!prompt.trim()) {
    return res.status(400).json({ requestId, error: 'prompt is required' });
  }

  // Load and prepare rules
  let rules = await getRules(industry);
  rules = prepareRules(rules);

  // Pre-check
  const preMatches = scanText(prompt, rules);
  const preAction = decideAction(preMatches);

  await insertAudit({
    requestId,
    userId,
    industry,
    phase: 'pre',
    matchedRules: preMatches,
    finalAction: preAction,
  });

  if (preAction === 'block') {
    return res.status(200).json({
      requestId,
      action: 'block',
      message: 'Request blocked due to restricted financial information.',
    });
  }

  // Call model (mock)
  const rawOutput = await generateText(prompt);

  // Post-check
  const postMatches = scanText(rawOutput, rules);
  const postAction = decideAction(postMatches);

  let finalOutput = rawOutput;
  let finalAction = postAction;

  if (postAction === 'block') {
    await insertAudit({
      requestId,
      userId,
      industry,
      phase: 'post',
      matchedRules: postMatches,
      finalAction: 'block',
    });

    return res.status(200).json({
      requestId,
      action: 'block',
      message: 'Generated response contained restricted financial information and was suppressed.',
    });
  }

  if (postAction === 'redact') {
    finalOutput = applyRedactions(rawOutput, rules);
    finalAction = 'redact';
  }

  await insertAudit({
    requestId,
    userId,
    industry,
    phase: 'post',
    matchedRules: postMatches,
    finalAction,
  });

  // Optional: if warn, attach a note (still returns response)
  const response = { requestId, action: finalAction, text: finalOutput };
  if (finalAction === 'warn') {
    response.note = 'Some content may be sensitive. Review before sending externally.';
  }

  return res.status(200).json(response);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`llm-mysql-guardrails listening on http://localhost:${port}`);
});
