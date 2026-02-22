llm-mysql-guardrails

A minimal, developer-friendly gateway that enforces industry/tenant policies using keywords stored in MySQL.

What it does
- Loads active guardrail rules from MySQL (with a small in-memory cache).
- Scans input text before invoking the model.
- Scans output text after the model response.
- Takes deterministic actions:
  - block: do not return the model response (and optionally skip calling the model)
  - redact: replace matched spans with placeholders
- Writes an audit record (metadata only) to MySQL.

This repo is intentionally small and easy to modify.

1) Prerequisites
- Node.js 18+
- MySQL 8+ (or MariaDB)
- npm install

2) Create database tables

Run the SQL below in your MySQL:

-- schema/guardrails.sql

3) Configure env
Create .env (or export env vars):

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=yourpass
MYSQL_DATABASE=guardrails_demo
CACHE_TTL_SECONDS=60

4) Start the server
npm install
npm run dev

Server runs at:
http://localhost:3000

5) Try it

POST /generate

Example (blocked due to "cost price"):

curl -s -X POST http://localhost:3000/generate   -H "Content-Type: application/json"   -d '{"industry":"electronics","userId":"u1","prompt":"Write a quote email. Cost price is 1.20 USD and margin is 35%."}' | jq .

Expected:
{
  "requestId": "...",
  "action": "block",
  "message": "Request blocked due to restricted financial information."
}

Example (allowed):

curl -s -X POST http://localhost:3000/generate   -H "Content-Type: application/json"   -d '{"industry":"electronics","userId":"u1","prompt":"Write a polite follow-up asking for lead time and MOQ."}' | jq .

6) Tests
npm test

Notes
- This project uses a mock "LLM" function (src/llmMock.js) to keep it runnable without external dependencies.
- Replace src/llmMock.js with your Amazon Bedrock call in production.
