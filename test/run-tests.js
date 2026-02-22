'use strict';

const assert = require('assert');
const { prepareRules, scanText, decideAction, applyRedactions } = require('../src/guardrails');

function run() {
  const rules = prepareRules([
    { id: 1, industry: 'common', category: 'financial_confidential', keyword: 'cost price', match_type: 'contains', action: 'block', severity: 5 },
    { id: 2, industry: 'common', category: 'financial_confidential', keyword: 'margin', match_type: 'contains', action: 'block', severity: 5 },
    { id: 3, industry: 'common', category: 'financial_confidential', keyword: '\\bUSD\\s*\\d+(?:\\.\\d+)?\\b', match_type: 'regex', action: 'redact', replacement_text: '[REDACTED:AMOUNT]', severity: 3 },
  ]);

  // 1) Pre-block
  {
    const prompt = 'Write a quote email. Cost price is 1.20 USD and margin is 35%.';
    const matches = scanText(prompt, rules);
    assert(matches.length >= 2);
    const action = decideAction(matches);
    assert.equal(action, 'block');
  }

  // 2) Redact (regex)
  {
    const out = 'Our price is USD 120.50 payable in advance.';
    const matches = scanText(out, rules);
    const action = decideAction(matches);
    assert.equal(action, 'redact');
    const redacted = applyRedactions(out, rules);
    assert(redacted.includes('[REDACTED:AMOUNT]'));
  }

  // 3) Allow
  {
    const prompt = 'Please write a follow-up email asking for lead time and MOQ.';
    const matches = scanText(prompt, rules);
    const action = decideAction(matches);
    assert.equal(action, 'allow');
  }

  console.log('All tests passed.');
}

run();
