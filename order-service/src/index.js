require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'), cors = require('cors');
const mysql = require('mysql2/promise'), axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { tracingMiddleware, forwardHeaders } = require('../../shared-utils/tracing');
const { createLogger } = require('../../shared-utils/logger');

const app = express(), logger = createLogger('order-service');
app.use(cors()); app.use(express.json()); app.use(tracingMiddleware);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.post('/orders/buy', async (req, res) => {
  const { txnId } = req.tracing;
  const { userId, productId } = req.body;
  const transactionId = uuidv4();
  try {
    logger.info(txnId, `Calling catalog-service for productId=${productId}`);
    const { data } = await axios.get(
      `${process.env.CATALOG_URL}/catalog/product/${productId}`,
      { headers: forwardHeaders(req) }
    );
    const product = data.product;

    const [result] = await pool.execute(
      'INSERT INTO orders (user_id, product_id, amount, status, transaction_id) VALUES (?, ?, ?, ?, ?)',
      [userId, productId, product.price, 'completed', transactionId]
    );
    const orderId = result.insertId;
    logger.info(txnId, `Order created: orderId=${orderId}, product=${product.name}, amount=${product.price}`);

    logger.info(txnId, `Calling notification-service for orderId=${orderId}`);
    const notif = await axios.post(
      `${process.env.NOTIFY_URL}/notify/send`,
      { orderId, productName: product.name, amount: product.price, transactionId },
      { headers: forwardHeaders(req) }
    );
    logger.info(txnId, `Notification sent for orderId=${orderId}`);

    res.json({
      success: true, orderId, product: product.name,
      amount: product.price, notification: notif.data.message, txnId
    });
  } catch (err) {
    logger.error(txnId, `Order failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/orders/history/:userId', async (req, res) => {
  const { txnId } = req.tracing;
  const [rows] = await pool.execute(
    'SELECT o.*, p.name as product_name FROM orders o JOIN products p ON o.product_id=p.id WHERE o.user_id=? ORDER BY o.created_time DESC',
    [req.params.userId]
  );
  logger.info(txnId, `Order history: user=${req.params.userId}, count=${rows.length}`);
  res.json({ orders: rows, txnId });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'order-service' }));
app.listen(process.env.PORT, () => console.log(`[order-service] port ${process.env.PORT}`));