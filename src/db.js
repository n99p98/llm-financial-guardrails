'use strict';

const mysql = require('mysql2/promise');
const { mysql: mysqlCfg } = require('./config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: mysqlCfg.host,
      port: mysqlCfg.port,
      user: mysqlCfg.user,
      password: mysqlCfg.password,
      database: mysqlCfg.database,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

async function loadActiveRules(industry) {
  const p = getPool();
  // Pull rules for the specific industry plus 'common'
  const [rows] = await p.query(
    `SELECT id, industry, category, keyword, match_type, action, replacement_text, severity
     FROM guardrail_rules
     WHERE is_active = 1 AND industry IN (?, 'common')
     ORDER BY severity DESC, id ASC`,
    [industry]
  );
  return rows;
}

async function insertAudit({ requestId, userId, industry, phase, matchedRules, finalAction }) {
  const p = getPool();
  await p.query(
    `INSERT INTO guardrail_audit_log (request_id, user_id, industry, phase, matched_rules_json, final_action)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [requestId, userId || null, industry, phase, JSON.stringify(matchedRules || []), finalAction]
  );
}

module.exports = {
  getPool,
  loadActiveRules,
  insertAudit,
};
