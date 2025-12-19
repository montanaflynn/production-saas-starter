# Go B2B Starter Backend

Professional Modular Monolith backend for B2B SaaS.

## ⚡️ Quick Start

```bash
# 1. Start dependencies (Postgres, Redis)
make run-deps

# 2. Run migrations
make migrateup

# 3. Start server with live reload
make dev
```

## 🏗 Architecture

We use a **Modular Monolith** architecture with **Clean Architecture** within each module.

- **`src/app/`**: Feature modules (Billing, Organizations, etc.)
- **`src/pkg/`**: Shared core (Auth, Database, Logger)
- **`src/api/`**: Shared API definitions
- **Generators**: `sqlc` (Database), `swag` (API Docs)

## 📚 Documentation

- **[Architecture Guide](./docs/01-architecture.md)** - Understand the layers
- **[Adding a Module](./docs/02-adding-a-module.md)** - How to create new features
- **[API & Auth](./docs/03-api-and-auth.md)** - Security and Request flow

## 🛠 Key Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start server with Air (Live Reload) |
| `make create-module type=app name=foo` | Generate a new module scaffold |
| `make migrateup` | Apply DB migrations |
| `make sqlc` | Generate type-safe DB code |
| `make swagger` | Generate Swagger docs |
