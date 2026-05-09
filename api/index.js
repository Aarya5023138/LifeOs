// Vercel Serverless entry point
// This file is the handler for all /api/* requests on Vercel
const app = require('../server/index.js');

// Vercel expects the default export to be a request handler.
// Express apps are valid handlers — Vercel's Node.js runtime wraps them.
module.exports = app;
