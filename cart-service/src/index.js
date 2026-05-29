require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'), cors = require('cors'), mysql = require('mysql2/promise');
const { tracingMiddleware } = require('../../shared-utils/tracing');
const { createLogger } = require('../../shared-utils/logger');

const app = express(), logger = createLogger('cart-service');
app.use(cors()); app.use(express.json()); app.use(tracingMiddleware);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.get('/cart/:userId', async (req, res) => {
  const { txnId } = req.tracing;
  const [rows] = await pool.execute(
    `SELECT c.cart_id, c.quantity, p.id as product_id, p.name, p.price, p.image_url
     FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?`,
    [req.params.userId]
  );
  logger.info(txnId, `Cart fetched: user=${req.params.userId}, items=${rows.length}`);
  res.json({ cart: rows, txnId });
});

app.post('/cart/add', async (req, res) => {
  const { txnId } = req.tracing;
  const { userId, productId, quantity = 1 } = req.body;
  const [ex] = await pool.execute('SELECT * FROM cart WHERE user_id=? AND product_id=?', [userId, productId]);
  if (ex.length) {
    await pool.execute('UPDATE cart SET quantity=? WHERE cart_id=?', [ex[0].quantity + quantity, ex[0].cart_id]);
  } else {
    await pool.execute('INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?)', [userId, productId, quantity]);
  }
  logger.info(txnId, `Added to cart: user=${userId}, product=${productId}`);
  res.json({ message: 'Added', txnId });
});

app.delete('/cart/remove/:cartId', async (req, res) => {
  const { txnId } = req.tracing;
  await pool.execute('DELETE FROM cart WHERE cart_id=?', [req.params.cartId]);
  logger.info(txnId, `Cart item removed: cartId=${req.params.cartId}`);
  res.json({ message: 'Removed', txnId });
});

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'cart-service' }));
app.listen(process.env.PORT, () => console.log(`[cart-service] port ${process.env.PORT}`));