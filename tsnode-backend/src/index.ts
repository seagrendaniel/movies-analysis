import * as dotenv from 'dotenv'
import express, {Request, Response} from 'express'
import cors from 'cors'
import {Pool} from 'pg'


dotenv.config({path: '../.env'})


const app = express()
app.use(cors());
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

  // Confirm sale_date param exists in API request
  if (!sale_date) {
    res.status(400).json({error: 'Please provide a sale_date parameter in the format YYYY-MM-DD.'})
    return
  }

  // Validate sale_date format
  try {
    new Date(sale_date)
  } catch (err) {
    res.status(400).json({error: 'Invalid sale_date provided. Please use the format YYYY-MM-DD.'})
    return
  }

  const FIXED_TICKET_PRICE = 10.00;
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
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.listen(port, () => {
  console.log(`Node backend listening on port http://localhost:${port}`)
})