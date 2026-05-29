require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express'), cors = require('cors');
const mysql = require('mysql2/promise'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const { tracingMiddleware } = require('../../shared-utils/tracing');
const { createLogger }     = require('../../shared-utils/logger');
 
const app = express(), logger = createLogger('auth-service');
app.use(cors()); app.use(express.json()); app.use(tracingMiddleware);
 
const pool = mysql.createPool({ host:process.env.DB_HOST, user:process.env.DB_USER,
  password:process.env.DB_PASSWORD, database:process.env.DB_NAME });
 
app.post('/auth/register', async (req, res) => {
  const { txnId } = req.tracing;
  const { username, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.execute('INSERT INTO users (username,email,password) VALUES (?,?,?)', [username,email,hash]);
    logger.info(txnId, `User registered: ${username}`);
    res.status(201).json({ message: 'Registered', txnId });
  } catch (err) {
    logger.error(txnId, `Register failed: ${err.message}`);
    res.status(400).json({ error: err.message });
  }
});
 
app.post('/auth/login', async (req, res) => {
  const { txnId } = req.tracing;
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'User not found' });
    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Wrong password' });
    const token = jwt.sign({ userId: rows[0].id, username: rows[0].username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    logger.info(txnId, `User login successful: ${rows[0].username}`);
    res.json({ token, userId: rows[0].id, username: rows[0].username, txnId });
  } catch (err) {
    logger.error(txnId, `Login error: ${err.message}`);
    res.status(500).json({ error: 'Server error' });
  }
});
 
app.get('/health', (_, res) => res.json({ status:'ok', service:'auth-service' }));
app.listen(process.env.PORT, () => console.log(`[auth-service] port ${process.env.PORT}`));
