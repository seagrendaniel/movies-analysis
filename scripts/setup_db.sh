#!/usr/bin/env bash

# Check for the .env file in the parent directory
if [ -f "../.env" ]; then
  # Export all variables from the .env file located in the project root
  set -a
  . ../.env
  set +a
else
  echo "No .env file found in the parent directory."
  exit 1
fi

# DB config fromenvironment variables with defaults
DB_NAME=${DB_NAME:-movie_theater_analytics}
DB_USER=${DB_USER:-admin}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Ensure PG_PASSWORD is set
if [ -z "$PG_PASSWORD" ]; then
  echo "PG_PASSWORD is not set. Please set it in your .env file."
  exit 1
fi

echo "Creating database schema in '$DB_NAME'..."

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF

-- Drop tables if they exist, cascading foreign key constraints
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS theater CASCADE;
DROP TABLE IF EXISTS movie CASCADE;

-- Create Customer table
CREATE TABLE customer (
    id SERIAL PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL
);

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
    customerId INT NOT NULL,
    theaterId INT NOT NULL,
    movieId INT NOT NULL,
    sale_date DATE NOT NULL,
    sales_amount NUMERIC, -- optional if you want to store individual amounts
    FOREIGN KEY (customerId) REFERENCES customer (id),
    FOREIGN KEY (theaterId) REFERENCES theater (id),
    FOREIGN KEY (movieId) REFERENCES movie (id)
);

EOF

echo "Database schema created successfully."
