import express from 'express'
import {Pool} from 'pg'

const app = express()
const port = 3001

const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'movie_theaters',
  password: 'simplepassword',
  port: 5432,
})

app.get('/', async (req, res) => {
  try{
    const result = await pool.query('SELECT NOW()')
    res.json({message: 'Hello from Node API', dbTime: result.rows[0]})
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({error: err.message})
    } else {
      res.status(500).json({error: 'An unexpected error occured'})
    }
  }
})

app.listen(port, () => {
  console.log(`Node backend listening on port http://localhost:${port}`)
})