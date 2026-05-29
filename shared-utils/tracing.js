const { v4: uuidv4 } = require('uuid');
 
function tracingMiddleware(req, res, next) {
  const txnId = req.headers['x-transaction-id'] || 'TXN-' + uuidv4().split('-')[0].toUpperCase();
  req.tracing = { txnId };
  res.setHeader('X-Transaction-ID', txnId);
  next();
}
 
function forwardHeaders(req) {
  return { 'X-Transaction-ID': req.tracing.txnId, 'Content-Type': 'application/json' };
}
 
module.exports = { tracingMiddleware, forwardHeaders };

