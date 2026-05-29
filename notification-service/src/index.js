require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'), cors = require('cors'), mysql = require('mysql2/promise');
const { tracingMiddleware } = require('../../shared-utils/tracing');
const { createLogger } = require('../../shared-utils/logger');

const app = express(), logger = createLogger('notification-service');
app.use(cors()); app.use(express.json()); app.use(tracingMiddleware);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.post('/notify/send', async (req, res) => {
  const { txnId } = req.tracing;
  const { orderId, productName, amount, transactionId } = req.body;
  const orderRef = 'ORD' + String(orderId).padStart(5, '0');
  const message = `Order successful | ${orderRef} | Thank you for purchasing ${productName}`;
  await pool.execute(
    'INSERT INTO notifications (order_id, message, transaction_id) VALUES (?, ?, ?)',
    [orderId, message, transactionId || txnId]
  );
  logger.info(txnId, `Notification sent: ${orderRef} — ${productName} — $${amount}`);
  res.json({ success: true, message, orderId: orderRef, txnId });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.listen(process.env.PORT, () => console.log(`[notification-service] port ${process.env.PORT}`));