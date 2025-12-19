# Backend Architecture
 
 The backend is a **Modular Monolith** designed for scalability and separation of concerns.
 
 ## High-Level Structure
 
 ```
 src/
 ├── app/              # Feature Modules (Domain Logic)
 │   ├── billing/
 │   ├── organizations/
 │   └── [your-module]/
 │
 ├── pkg/              # Shared Infrastructure (The "Platform")
 │   ├── db/
 │   ├── server/
 │   └── auth/
 │
 ├── api/              # Shared Contracts (DTOs, Interfaces)
 └── main/             # Entry Point (Wiring)
 ```
 
 ## Analysis of a Module
 
 Each module in `src/app` follows **Clean Architecture**:
 
 ```
 src/app/billing/
 ├── api/              # Delivery Layer (Gin Handlers)
 │   └── handler.go    # HTTP -> Service
 │
 ├── app/              # Application Layer (Use Cases)
 │   └── service.go    # Business Logic
 │
 ├── domain/           # Domain Layer (Core)
 │   ├── entities.go   # Data Structures
 │   └── repository.go # Interface Definitions
 │
 └── infra/            # Infrastructure Layer (External)
     └── repository.go # GORM Implementation
 ```
 
 ## Key Principles
 
 1. **Dependency Rule**: Inner layers (Domain) rely on nothing. Outer layers (Infra) rely on inner layers.
 2. **Modules are Isolated**: Modules verify other modules via Public Interfaces (in `domain`), not direct DB access.
 3. **Shared Kernel**: `src/pkg` contains code shared by everything (Postgres connection, Logging, etc).
 
 ## Request Flow
 
 ```mermaid
 sequenceDiagram
     Client->>Handler: HTTP Request
     Handler->>Service: Call Use Case
     Service->>Repository: Get Data (Interface)
     Repository->>DB: SQL Query (Implementation)
     DB-->>Repository: Result
     Repository-->>Service: Entity
     Service-->>Handler: DTO
     Handler-->>Client: JSON Response
 ```
