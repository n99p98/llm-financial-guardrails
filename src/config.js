'use strict';

function getEnv(name, fallback) {
  const v = process.env[name];
  return (v === undefined || v === '') ? fallback : v;
}

module.exports = {
  mysql: {
    host: getEnv('MYSQL_HOST', '127.0.0.1'),
    port: Number(getEnv('MYSQL_PORT', '3306')),
    user: getEnv('MYSQL_USER', 'root'),
    password: getEnv('MYSQL_PASSWORD', ''),
    database: getEnv('MYSQL_DATABASE', 'guardrails_demo'),
  },
  cacheTtlSeconds: Number(getEnv('CACHE_TTL_SECONDS', '60')),
  port: Number(getEnv('PORT', '3000')),
};
