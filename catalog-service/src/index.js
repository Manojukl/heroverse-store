require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'), cors = require('cors'), mysql = require('mysql2/promise');
const { tracingMiddleware } = require('../../shared-utils/tracing');
const { createLogger } = require('../../shared-utils/logger');

const app = express(), logger = createLogger('catalog-service');
app.use(cors()); app.use(express.json()); app.use(tracingMiddleware);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.get('/catalog/products', async (req, res) => {
  const { txnId } = req.tracing;
  const [rows] = await pool.execute('SELECT * FROM products ORDER BY category, id');
  logger.info(txnId, `Products fetched: ${rows.length} total`);
  res.json({ products: rows, txnId });
});

app.get('/catalog/products/:category', async (req, res) => {
  const { txnId } = req.tracing;
  const [rows] = await pool.execute('SELECT * FROM products WHERE category = ?', [req.params.category]);
  logger.info(txnId, `Category=${req.params.category}: ${rows.length} products`);
  res.json({ products: rows, txnId });
});

app.get('/catalog/product/:id', async (req, res) => {
  const { txnId } = req.tracing;
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  logger.info(txnId, `Product fetched: ${rows[0].name}`);
  res.json({ product: rows[0], txnId });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'catalog-service' }));
app.listen(process.env.PORT, () => console.log(`[catalog-service] port ${process.env.PORT}`));