# Movie Theater Analytics

This project is a full-stack application that allows users to analyze movie theater performance by querying a shared PostgreSQL database via both a Node API and a Django API. The React client fetches data from these APIs and displays the best-performing theater for a given date.

## Table of Contents

- [Project Overview](#project-overview)
- [PostgreSQL Setup](#postgresql-setup)
- [Environment Variables](#environment-variables)
- [API Setup](#api-setup)
  - [Django API](#django-api)
  - [Node API](#node-api)
- [Database Schema and Seeding](#database-schema-and-seeding)
- [Running the Application](#running-the-application)
- [Security Considerations](#security-considerations)
- [License](#license)

## Project Overview

This application provides two API backends (Node and Django) that share a single PostgreSQL database. The React client allows users to:
- Select a sale date via a calendar widget.
- View lists of theater locations and movies.
- Query the "best theater" (i.e., the theater with the highest ticket sales) for the selected date via either the Node API or the Django API.

## PostgreSQL Setup

Ensure PostgreSQL is installed and running on your machine. For example, on macOS using Homebrew:

```bash
brew services start postgresql@14

```
You must also set up the required database, role, and schema. To initialize your PostgreSQL database:

- Connect to PostgreSQL using a superuser (e.g., your OS username or `postgres` if available):

```bash
psql -h localhost -p 5432 -U <your_username> -d postgres
```

- Run the following SQL commands (adjust password as needed): 

```sql
CREATE ROLE admin WITH LOGIN PASSWORD 'simplepassword';
ALTER ROLE admin WITH SUPERUSER;
CREATE DATABASE movie_theater_analytics OWNER admin;
```

- Use the provided `setup_and_seed_db.sh` script to create the DB schema and see the database with test data.

## Environment Variables

This project uses a shared `.env` file (located in the project root) to configure both the Django and Node APIs. A sample environment file is provided as `.env.example`.

To set up your environment: 

- Copy `.env.example` to `.env` 

```bash
cp .env.example .env
```

- Edit `.env` with your own configuration as needed. Example content: 

```.env
# Django settings
SECRET_KEY="c9ccf%skkd*&@f0v26)p53n^w0=xnsl=f$5@n$e1zq(q@e0d02"
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database settings (Django & Node)
DB_NAME=movie_theater_analytics
DB_USER=admin
PG_PASSWORD=simplepassword
DB_HOST=localhost
DB_PORT=5432
```

## API Setup

### Django API

1. Set up a Virtual Environment: 

	Navigate to the `django_backend` directory and create a virtual environment like below: 
	
	```bash
	cd django_backend
	python3 -m venv env
	source env/bin/activate   # On Windows: 	env\Scripts\activate
	```
2. Install Requirements: 

	```bash
	pip install -r requirements.txt
	```
	
3. Apply Migrations: 

	```bash
	python manage.py migrate
	```
	
4. Run the server: 

	```bash
	python manage.py runserver 8000
	```
	
5. CORS Setup:

	The Django API uses `django-cors-headers` to 	allow cross origin requests. Ensure your 	`settings.py` file includes: 
	
	```python
	INSTALLED_APPS = [
    # ... your other apps ...
    'corsheaders',
    'rest_framework',
    'api',
	]
	MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... rest of your middleware ...
	]
	CORS_ALLOW_ALL_ORIGINS = True
	```
	
### Node API

1. Install Dependencies: 

	In the `tsnode-backend` directory, run: 
	
	```bash
		npm install
		npm install cors @types/cors
	```
	
2. Run the server: 

	```bash
	npm start
	```

## Database Schema and Seeding

The database schema includes three tables:

- theater: Stores theater data (id, company, location).
- movie: Stores movie data (id, title).
- tickets: Stores ticket sales data (with sale_date, calculated revenue).

A seeding script (`setup_and_seed_db.sh`) is provided in the `scripts` directory. To run it: 

	chmod +x scripts/setup_and_seed_db.sh
	./scripts/setup_and_seed_db.sh
	
## Running the Application

1. Start the PostgreSQL server.
2. Run the Django API server: `python manage.py runserver 8000` (inside `django_backend`).
3. Run the Node API server: `npm start` (inside `tsnode-backend`).
4. Run the React Client: Navigate to `a2a-client` and run: 

	```bash
	npm start
	```
	
The React client runs on `http://localhost:3000` and can query both the Django and Node APIs.

## Security Considerations

To help protect the application against malicious queries and potential abuse, the following security measures have been implemented:

- **Parameterized Queries:**  
  Both the Node and Django APIs use parameterized queries (via the `pg` library for Node and Django’s database cursor for Django) to prevent SQL injection attacks.

- **Input Validation:**  
  The APIs validate input data (e.g., ensuring the `sale_date` follows the YYYY-MM-DD format) before processing queries. Helper functions and explicit validations are used to reject improperly formatted or missing data.

- **Rate Limiting:**  
  - In the **Node API**, the [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) package is used to limit the number of requests per IP address.  
  - In the **Django API**, the [django-ratelimit](https://pypi.org/project/django-ratelimit/) package is employed to block excessive requests, reducing the risk of denial-of-service (DoS) attacks.

- **Logging and Monitoring:**  
  - **Node API:** Uses [morgan](https://www.npmjs.com/package/morgan) to log incoming HTTP requests for monitoring and debugging purposes.
  - **Django API:** The built-in logging framework is configured to capture warnings and errors, which helps in identifying suspicious activity.

- **CORS Configuration:**  
  Cross-Origin Resource Sharing (CORS) is configured for both APIs (using `cors` in Node and `django-cors-headers` in Django) to control which origins can access the API endpoints.

These measures work together to safeguard the application against common web vulnerabilities and abuse by "bad actors."


## License

This project is licensed under the MIT License.
