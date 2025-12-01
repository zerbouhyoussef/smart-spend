process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
const port = 3001;
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL.replace('?sslmode=require', '');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000, // Fail fast after 5 seconds
});

// Log pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
    console.error('FAILED TO CONNECT TO DATABASE. Check your internet connection and firewall.');
  } else {
    console.log('Successfully connected to database!');
    release();
  }
});

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

app.use(helmet()); // Secure headers
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// --- Budget ---

app.get('/api/budget', async (req, res) => {
  try {
    const cachedBudget = cache.get('budget');
    if (cachedBudget) {
      console.log('Cache Hit: budget');
      return res.json(cachedBudget);
    }

    const result = await pool.query('SELECT amount FROM budget WHERE id = $1', ['main_budget']);
    const data = { amount: result.rows[0]?.amount || 0 };
    
    cache.set('budget', data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budget', async (req, res) => {
  const { amount } = req.body;
  try {
    await pool.query(`
      INSERT INTO budget (id, amount) VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET amount = $2
    `, ['main_budget', amount]);
    
    cache.del('budget'); // Invalidate cache
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Planned Items ---

app.get('/api/planned-items', async (req, res) => {
  try {
    const cachedItems = cache.get('plannedItems');
    if (cachedItems) {
      console.log('Cache Hit: plannedItems');
      return res.json(cachedItems);
    }

    const result = await pool.query('SELECT * FROM planned_items');
    // Map snake_case to camelCase for frontend
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      targetQuantity: row.target_quantity,
      purchasedQuantity: row.purchased_quantity,
      pricePerUnit: Number(row.price_per_unit)
    }));
    
    cache.set('plannedItems', items);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/planned-items', async (req, res) => {
  const { id, name, targetQuantity, purchasedQuantity, pricePerUnit } = req.body;
  try {
    await pool.query(`
      INSERT INTO planned_items (id, name, target_quantity, purchased_quantity, price_per_unit)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, targetQuantity, purchasedQuantity, pricePerUnit]);
    
    cache.del('plannedItems'); // Invalidate cache
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/planned-items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, targetQuantity, purchasedQuantity, pricePerUnit } = req.body;
  try {
    await pool.query(`
      UPDATE planned_items 
      SET name = $1, target_quantity = $2, purchased_quantity = $3, price_per_unit = $4
      WHERE id = $5
    `, [name, targetQuantity, purchasedQuantity, pricePerUnit, id]);
    
    cache.del('plannedItems'); // Invalidate cache
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/planned-items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM planned_items WHERE id = $1', [id]);
    
    cache.del('plannedItems'); // Invalidate cache
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Actual Items ---

app.get('/api/actual-items', async (req, res) => {
  try {
    const cachedItems = cache.get('actualItems');
    if (cachedItems) {
      console.log('Cache Hit: actualItems');
      return res.json(cachedItems);
    }

    const result = await pool.query('SELECT * FROM actual_items ORDER BY date DESC');
    const items = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      totalCost: Number(row.total_cost),
      date: row.date.toISOString().split('T')[0], // Format date
      plannedItemId: row.planned_item_id
    }));
    
    cache.set('actualItems', items);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actual-items', async (req, res) => {
  const { id, name, quantity, totalCost, date, plannedItemId } = req.body;
  try {
    await pool.query(`
      INSERT INTO actual_items (id, name, quantity, total_cost, date, planned_item_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, name, quantity, totalCost, date, plannedItemId || null]);
    
    cache.del('actualItems'); // Invalidate cache
    // Also invalidate planned items because triggers might update them
    cache.del('plannedItems'); 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/actual-items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, totalCost, date, plannedItemId } = req.body;
  try {
    await pool.query(`
      UPDATE actual_items 
      SET name = $1, quantity = $2, total_cost = $3, date = $4, planned_item_id = $5
      WHERE id = $6
    `, [name, quantity, totalCost, date, plannedItemId || null, id]);
    
    cache.del('actualItems'); // Invalidate cache
    cache.del('plannedItems'); 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/actual-items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM actual_items WHERE id = $1', [id]);
    
    cache.del('actualItems'); // Invalidate cache
    cache.del('plannedItems'); 
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
