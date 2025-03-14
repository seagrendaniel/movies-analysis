#!/usr/bin/env bash

# Get the directory where the script is located
SCRIPT_DIR="$(dirname "$0")"
# Define the path to the .env file in the project root
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
    set -a
    . "$ENV_FILE"
    set +a
else
    echo "No .env file found at $ENV_FILE."
    exit 1
fi

# Database configuration from environment variables, with defaults if not set
DB_NAME=${DB_NAME:-movie_theater_analytics}
DB_USER=${DB_USER:-admin}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Ensure PG_PASSWORD is set
if [ -z "$PG_PASSWORD" ]; then
    echo "PG_PASSWORD is not set in .env file."
    exit 1
fi

echo "Creating database schema in '$DB_NAME'..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
-- Drop tables if they exist
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS theater CASCADE;
DROP TABLE IF EXISTS movie CASCADE;

-- Create Theater table
CREATE TABLE theater (
    id SERIAL PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL
);

-- Create Movie table
CREATE TABLE movie (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL
);

-- Create Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    theaterId INT NOT NULL,
    movieId INT NOT NULL,
    sale_date DATE NOT NULL,
    sales_amount NUMERIC, -- Optional; revenue will be calculated by counting tickets
    FOREIGN KEY (theaterId) REFERENCES theater (id),
    FOREIGN KEY (movieId) REFERENCES movie (id)
);
EOF

echo "Database schema created successfully."
echo "Seeding database..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<'EOF'
-- Insert 10 theaters: For each of the 5 fixed locations, insert one theater per company.
INSERT INTO theater (company, location) VALUES
  ('TypeScript Theaters', 'Los Angeles'),
  ('TypeScript Theaters', 'Portland'),
  ('TypeScript Theaters', 'Seattle'),
  ('TypeScript Theaters', 'Denver'),
  ('TypeScript Theaters', 'Boston'),
  ('Python Playhouses', 'Los Angeles'),
  ('Python Playhouses', 'Portland'),
  ('Python Playhouses', 'Seattle'),
  ('Python Playhouses', 'Denver'),
  ('Python Playhouses', 'Boston');

-- Insert 2 movies
INSERT INTO movie (title) VALUES
  ('Pulp Fiction'),
  ('Remember the Titans');

-- Seed tickets for each day from 6 months ago until today
DO $$
DECLARE
  rec_date DATE;
  num_tickets INTEGER;
  theater_id INTEGER;
  movie_id INTEGER;
BEGIN
  -- Loop over each day range
  FOR rec_date IN SELECT generate_series(current_date - interval '6 months', current_date, '1 day')
  LOOP
    -- For each theater
    FOR theater_id IN SELECT id FROM theater LOOP
      -- For each movie
      FOR movie_id IN SELECT id FROM movie LOOP
        -- 50% chance to insert ticket records for the current combination
        IF random() < 0.5 THEN
          -- Generate a random number of tickets between 1 and 10
          num_tickets := (floor(random() * 10) + 1)::INTEGER;
          FOR i IN 1..num_tickets LOOP
            INSERT INTO tickets (theaterId, movieId, sale_date, sales_amount)
            VALUES (theater_id, movie_id, rec_date, NULL);
          END LOOP;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
EOF

echo "Database seeding complete."
