'use strict';

const { cacheTtlSeconds } = require('./config');
const { loadActiveRules } = require('./db');

const cache = new Map();
// cache key: industry -> { rules, expiresAtMs }

async function getRules(industry) {
  const now = Date.now();
  const entry = cache.get(industry);
  if (entry && entry.expiresAtMs > now) return entry.rules;

  const rules = await loadActiveRules(industry);
  cache.set(industry, { rules, expiresAtMs: now + cacheTtlSeconds * 1000 });
  return rules;
}

module.exports = { getRules };
