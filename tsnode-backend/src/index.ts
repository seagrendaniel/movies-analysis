import * as dotenv from 'dotenv'
import express, {Request, Response} from 'express'
import cors from 'cors'
import {Pool} from 'pg'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import { Interface } from 'readline'
import { error } from 'console'


dotenv.config({path: '../.env'})

/* ------------------------ Utility ------------------------------ */

// Rate limit requests to 1 req/sec (60 req/min)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests from this IP address, please try again later.'
})

// Helper function to validate date format from API request
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if(!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

interface PerformanceData {
  theaterId: number,
  company: string,
  location: string,
  sales: [{
    date: string,
    ticketsSold: number,
    revenue: number
  }]
}

/* ------------------------ API ------------------------------ */

const FIXED_TICKET_PRICE = 10.00;

const app = express()
app.use(cors());
app.use(limiter)
app.use(morgan('combined'))
const port = process.env.PORT || 4000


// Create PSQL Pool
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'movie_theater_analytics',
  password: process.env.PG_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432
})

app.get('/api/best_theater', async (req: Request, res: Response): Promise<void> => {
  const sale_date: string = req.query.sale_date as string
  // Confirm sale_date param exists in API request and in correct format
  if (!sale_date || !isValidDate(sale_date)) {
    res.status(400).json({error: 'Invalid or missing sale_date parameter (expected format: YYYY-MM-DD).'})
    return
  }

  const queryBestTheater = `
    SELECT t.id AS theater_id, t.company AS company_name, t.location,
           COUNT(s.id) AS total_sales, COUNT(s.id) * $2 AS total_revenue
    FROM tickets s
    JOIN theater t ON s.theaterId = t.id
    WHERE s.sale_date = $1
    GROUP BY t.id, t.company, t.location
    ORDER BY total_sales DESC
    LIMIT 1;
  `;

  try {
    const result = await pool.query(queryBestTheater, [sale_date, FIXED_TICKET_PRICE])
    if (result.rows.length > 0) {
      res.json(result.rows[0])
    } else {
      res.status(404).json({message: 'No data found for the given date.'})
    }
  } catch (err) {
    console.error('Error executing query', err)
    res.status(500).json({error: 'Internal server errror.'})
  }
})

// GET theaters
app.get('/api/theaters', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `SELECT id, company, location FROM theater ORDER BY id`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching theaters:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET Movies
app.get('/api/movies', async (req: Request, res: Response):Promise<void> => {
  try {
    const query = `SELECT id, title FROM movie ORDER BY id`;
    const result = await pool.query(query);``
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET Sales Performance for both Companies
app.get('/api/company_sales_performance', async (req: Request, res: Response): Promise<void> => {
  const company = req.query.company as string;
  if (!company) {
    res.status(400).json({ error: 'Please provide a company parameter.' });
    return;
  }

  const query = `
    SELECT
      t.id AS "theaterId",
      t.company AS "company",
      t.location AS "location",
      json_agg(
        json_build_object(
          'date', to_char(tp.sale_date, 'YYYY-MM'),
          'ticketsSold', tp.ticketsSold,
          'revenue', tp.revenue
        ) ORDER BY tp.sale_date
      ) AS "sales"
    FROM theater t
    JOIN (
      SELECT 
        theaterId,
        sale_date,
        COUNT(*) AS ticketsSold,
        COUNT(*) * $1 AS revenue
      FROM tickets
      WHERE sale_date BETWEEN current_date - interval '6 months' AND current_date
      GROUP BY theaterId, sale_date
    ) tp ON tp.theaterId = t.id
    WHERE t.company = $2
    GROUP BY t.id, t.company, t.location;
  `;

  try {
    const result = await pool.query(query, [FIXED_TICKET_PRICE, company]);
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'No sales data found for the given company.' });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`Node backend listening on port http://localhost:${port}`)
})