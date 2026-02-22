'use strict';

function normalizeText(s) {
  return (s || '').toString();
}

function compileRule(rule) {
  if (rule.match_type === 'regex') {
    // Note: keyword column holds the regex pattern.
    // Use 'i' for case-insensitive by default.
    return { ...rule, _re: new RegExp(rule.keyword, 'i') };
  }
  return rule;
}

function scanText(text, rules) {
  const t = normalizeText(text);
  const matches = [];

  for (const r0 of rules) {
    const r = r0._re || r0.match_type === 'regex' ? r0 : r0; // safety
    if (r.match_type === 'contains') {
      const needle = (r.keyword || '').toLowerCase();
      if (!needle) continue;
      if (t.toLowerCase().includes(needle)) {
        matches.push({
          ruleId: r.id,
          industry: r.industry,
          category: r.category,
          action: r.action,
          severity: r.severity,
          match_type: r.match_type,
          keyword: r.keyword,
        });
      }
    } else if (r.match_type === 'regex') {
      const re = r._re || new RegExp(r.keyword, 'i');
      if (re.test(t)) {
        matches.push({
          ruleId: r.id,
          industry: r.industry,
          category: r.category,
          action: r.action,
          severity: r.severity,
          match_type: r.match_type,
          keyword: r.keyword,
        });
      }
    }
  }
  return matches;
}

function decideAction(matches) {
  // deterministic priority: block > redact > warn > log > allow
  const actions = matches.map(m => m.action);
  if (actions.includes('block')) return 'block';
  if (actions.includes('redact')) return 'redact';
  if (actions.includes('warn')) return 'warn';
  if (actions.includes('log')) return 'log';
  return 'allow';
}

function applyRedactions(text, rules) {
  let out = normalizeText(text);

  // Apply redact rules only, highest severity first
  const redactRules = rules
    .filter(r => r.action === 'redact')
    .slice()
    .sort((a, b) => (b.severity || 0) - (a.severity || 0));

  for (const r0 of redactRules) {
    const r = r0.match_type === 'regex'
      ? (r0._re ? r0 : { ...r0, _re: new RegExp(r0.keyword, 'ig') })
      : r0;

    const replacement = r.replacement_text || `[REDACTED:${r.category}]`;

    if (r.match_type === 'contains') {
      // replace case-insensitively for contains
      const escaped = r.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'ig');
      out = out.replace(re, replacement);
    } else if (r.match_type === 'regex') {
      const re = r._re instanceof RegExp ? r._re : new RegExp(r.keyword, 'ig');
      out = out.replace(re, replacement);
    }
  }
  return out;
}

function prepareRules(rawRules) {
  return rawRules.map(compileRule);
}

module.exports = {
  prepareRules,
  scanText,
  decideAction,
  applyRedactions,
};
