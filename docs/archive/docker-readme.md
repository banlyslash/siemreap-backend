# Docker Setup for Leave Request Management System

This guide explains how to use Docker Compose to run a local PostgreSQL database for development.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. Start the PostgreSQL database and pgAdmin:

```bash
docker-compose up -d
```

2. Stop the containers:

```bash
docker-compose down
```

3. Stop the containers and remove volumes (this will delete all data):

```bash
docker-compose down -v
```

## Database Connection

The PostgreSQL database is available at:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: postgres
- **Database**: lrms_db

You can update these values in the `.env.docker` file.

## pgAdmin

pgAdmin is a web-based administration tool for PostgreSQL. You can access it at:

- **URL**: http://localhost:5050
- **Email**: admin@example.com
- **Password**: admin

### Connecting to PostgreSQL from pgAdmin

1. Open pgAdmin at http://localhost:5050
2. Log in with the credentials above
3. Right-click on "Servers" and select "Create" > "Server"
4. Enter a name for your server (e.g., "LRMS Database")
5. Go to the "Connection" tab and enter:
   - **Host name/address**: postgres (this is the service name in docker-compose)
   - **Port**: 5432
   - **Maintenance database**: lrms_db
   - **Username**: postgres
   - **Password**: postgres
6. Click "Save"

## Using with Prisma

The `.env` file has been updated to use the Docker PostgreSQL database. You can run Prisma commands as usual:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

## Troubleshooting

- If you encounter permission issues, you might need to run Docker commands with `sudo`
- If the port 5432 is already in use, you can change it in the `docker-compose.yml` file
- If you need to reset the database, run `docker-compose down -v` and then `docker-compose up -d`
