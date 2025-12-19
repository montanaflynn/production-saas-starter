# 🛠️ Setup Guide

This document covers the manual steps to verify your environment if `setup.sh` is not sufficient.

## 1. Environment Variables

The kit comes with example files. You need to copy them to the "live" filenames.

### Backend (`backend`)
```bash
cp backend/example.env backend/app.env
```
Open `app.env` and fill in the keys:
*   `DB_SOURCE`: Your Postgres connection string.
*   `STYTCH_PROJECT_ID`: From Stytch Dashboard.
*   `POLAR_ACCESS_TOKEN`: From Polar.sh.

### Frontend (`frontend`)
```bash
cp frontend/.env.example frontend/.env.local
```
Update `.env.local` with your public API keys.

## 2. Docker Dependencies

If you prefer running dependencies manually (without `setup.sh`):

```bash
cd backend
docker compose -f deps/docker-compose.yml up -d postgres redis
```

## 3. Database Migrations

Once Docker is running, you must apply the schema:

```bash
cd backend
make migrateup
```

## 4. Troubleshooting
If the backend fails to start, verify that Redis is reachable on port `6379`.
