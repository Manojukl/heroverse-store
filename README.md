# ⚡ HeroVerse Store

A microservices-based e-commerce application built for **Dynatrace APM monitoring**, distributed tracing, PurePath analysis, and log correlation demos.

> Shop DC and Marvel hero merchandise across 5 independent Node.js services with full observability.

![HeroVerse Store](https://placehold.co/1200x400/0a0a1f/93c5fd?text=⚡+HeroVerse+Store+—+DC+%26+Marvel+Universe)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Dynatrace Monitoring](#dynatrace-monitoring)
- [Project Structure](#project-structure)

---

## 🏗️ Architecture

| Service | Port | Description |
|---|---|---|
| **frontend** | 3000 | React app — DC Store, Marvel Store, Cart, Orders |
| **auth-service** | 4001 | User registration, login, JWT tokens |
| **catalog-service** | 4002 | Product listing by DC / Marvel category |
| **cart-service** | 4003 | Add, remove, view cart items |
| **order-service** | 4004 | Create orders → calls catalog + notification |
| **notification-service** | 4005 | Mock notifications, saves to DB |
| **MySQL** | 3306 | Persistent storage for all services |

### Service Flow (Buy Now)
```
Browser
  └── POST /orders/buy  (order-service)
        ├── GET /catalog/product/:id  (catalog-service)
        │     └── MySQL: SELECT products
        ├── MySQL: INSERT orders
        └── POST /notify/send  (notification-service)
              └── MySQL: INSERT notifications
```

---

## ✅ Prerequisites

Install all of these before running the application.

### 1. Node.js (v18 LTS or higher)

Download from: https://nodejs.org

```bash
# Verify after install
node --version    # v18.x.x or higher
npm --version     # 9.x.x or higher
```

### 2. MySQL (v8.0 or higher)

Download from: https://dev.mysql.com/downloads/mysql/

- Install MySQL Server and MySQL Workbench
- Note your **root password** — you will need it in the `.env` files
- Make sure the MySQL service is **Running** (Windows: `services.msc` → MySQL80)

### 3. Git

Download from: https://git-scm.com

```bash
# Verify after install
git --version
```

### 4. VS Code (recommended)

Download from: https://code.visualstudio.com

---

## 🚀 Installation

### Step 1 — Clone the Repository

```bash
# Create project directory and clone
mkdir C:\Projects
cd C:\Projects
git clone https://github.com/YOUR_USERNAME/heroverse-store.git
cd heroverse-store
```

> ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username.

---

### Step 2 — Set Up the Database

1. Open **MySQL Workbench**
2. Connect to `localhost:3306` with your root credentials
3. Open a new Query tab
4. Open and run the file: `database/init.sql`

```sql
-- Or run directly:
source C:/Projects/heroverse-store/database/init.sql
```

Verify it worked:
```sql
USE heroverse_db;
SHOW TABLES;          -- should show 5 tables
SELECT COUNT(*) FROM products;   -- should show 8
```

---

### Step 3 — Configure Environment Variables

Each service has a `.env` file. Update the **DB_PASSWORD** in all of them.

```
auth-service/.env
catalog-service/.env
cart-service/.env
order-service/.env
notification-service/.env
```

In each file, change:
```env
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
```
to your actual MySQL root password.

---

### Step 4 — Install Dependencies

Run these one by one in PowerShell:

```powershell
# Shared utilities (install first)
cd C:\Projects\heroverse-store\shared-utils
npm install

# Auth Service
cd C:\Projects\heroverse-store\auth-service
npm install

# Catalog Service
cd C:\Projects\heroverse-store\catalog-service
npm install

# Cart Service
cd C:\Projects\heroverse-store\cart-service
npm install

# Order Service
cd C:\Projects\heroverse-store\order-service
npm install

# Notification Service
cd C:\Projects\heroverse-store\notification-service
npm install

# Frontend
cd C:\Projects\heroverse-store\frontend
npm install
```

---

## ▶️ Running the Application

Open **6 separate PowerShell windows** — one per service.

```powershell
# Terminal 1 — Auth Service
cd C:\Projects\heroverse-store\auth-service
npm install --save-dev nodemon
npm run dev

# Terminal 2 — Catalog Service
cd C:\Projects\heroverse-store\catalog-service
npm install --save-dev nodemon
npm run dev

# Terminal 3 — Cart Service
cd C:\Projects\heroverse-store\cart-service
npm install --save-dev nodemon
npm run dev

# Terminal 4 — Notification Service
cd C:\Projects\heroverse-store\notification-service
npm install --save-dev nodemon
npm run dev

# Terminal 5 — Order Service
cd C:\Projects\heroverse-store\order-service
npm install --save-dev nodemon
npm run dev

# Terminal 6 — Frontend
cd C:\Projects\heroverse-store\frontend
npm install --save-dev nodemon
npm start
```

### Verify All Services Are Running

Open these in your browser:

```
http://localhost:4001/health   →  { "status": "ok", "service": "auth-service" }
http://localhost:4002/health   →  { "status": "ok", "service": "catalog-service" }
http://localhost:4003/health   →  { "status": "ok", "service": "cart-service" }
http://localhost:4004/health   →  { "status": "ok", "service": "order-service" }
http://localhost:4005/health   →  { "status": "ok", "service": "notification-service" }
http://localhost:3000          →  HeroVerse Store homepage
```

---

## 🌐 API Endpoints

### Auth Service — `localhost:4001`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT token |
| GET | `/auth/profile` | Get profile (auth required) |

### Catalog Service — `localhost:4002`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/catalog/products` | All products |
| GET | `/catalog/products/DC` | DC products only |
| GET | `/catalog/products/Marvel` | Marvel products only |
| GET | `/catalog/product/:id` | Single product by ID |

### Cart Service — `localhost:4003`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart/:userId` | View cart |
| POST | `/cart/add` | Add item to cart |
| DELETE | `/cart/remove/:cartId` | Remove item from cart |

### Order Service — `localhost:4004`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/buy` | Buy Now — single product |
| GET | `/orders/history/:userId` | Order history |

### Notification Service — `localhost:4005`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/notify/send` | Send notification (called by order-service) |

---

## 🔍 Dynatrace Monitoring

### Install OneAgent

1. Login to your Dynatrace tenant
2. Go to **Hub → OneAgent → Download → Windows**
3. Run installer as **Administrator**
4. Restart all Node.js services

### What Dynatrace Discovers Automatically

- ✅ All 5 services auto-discovered
- ✅ MySQL database calls with full SQL
- ✅ Service flow and dependency map
- ✅ PurePath distributed traces (especially Buy Now)
- ✅ Response times per endpoint

### Distributed Tracing Headers

Every request carries these headers across all services:

| Header | Purpose |
|---|---|
| `X-Transaction-ID` | Generated once, propagated to all downstream services |
| `Content-Type` | Standard JSON header |

### Log Correlation

Logs are written to: `C:\Projects\heroverse-store\logs\heroverse.log`

Every log line contains the Transaction ID:
```
[TXN-A1B2C3] [order-service]        INFO  Order created: orderId=7, amount=24.99
[TXN-A1B2C3] [catalog-service]      INFO  Product fetched: Batman Figure
[TXN-A1B2C3] [notification-service] INFO  Notification sent: ORD00007
```

### DQL Queries for Log Analytics

```sql
-- All HeroVerse logs
fetch logs
| filter contains(content, "TXN-")
| fields timestamp, content, dt.process.name
| sort timestamp asc

-- Trace a specific transaction
fetch logs
| filter contains(content, "TXN-A1B2C3")
| fields timestamp, content
| sort timestamp asc

-- All errors
fetch logs
| filter contains(content, "ERROR")
| sort timestamp desc
```

---

## 📁 Project Structure

```
heroverse-store/
├── frontend/                    # React app (port 3000)
│   └── src/
│       ├── pages/
│       │   ├── Home.js          # DC / Marvel universe cards
│       │   ├── Store.js         # Product grid with dark theme
│       │   ├── Cart.js          # Cart with Buy + Remove
│       │   ├── Login.js         # Dark glassmorphism login
│       │   └── Register.js      # Dark glassmorphism register
│       ├── utils/api.js         # All API calls with tracing headers
│       └── App.js               # Router + sticky navbar
├── auth-service/                # JWT auth (port 4001)
│   ├── .env
│   └── src/index.js
├── catalog-service/             # Products (port 4002)
│   ├── .env
│   └── src/index.js
├── cart-service/                # Cart (port 4003)
│   ├── .env
│   └── src/index.js
├── order-service/               # Orders (port 4004)
│   ├── .env
│   └── src/index.js
├── notification-service/        # Notifications (port 4005)
│   ├── .env
│   └── src/index.js
├── shared-utils/                # Reusable middleware
│   ├── tracing.js               # X-Transaction-ID propagation
│   └── logger.js                # Structured log output to file
├── database/
│   └── init.sql                 # Schema + seed data
└── logs/
    └── heroverse.log            # All service logs (Dynatrace reads this)
```

---

## 🛠️ Troubleshooting

| Error | Fix |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Wrong DB_PASSWORD in .env |
| `Cannot find module '../../shared-utils'` | Run `npm install` in shared-utils first |
| `Port already in use` | Run `netstat -ano \| findstr :4001` then `taskkill /PID <pid> /F` |
| Products not loading | Run `SELECT * FROM products;` in MySQL Workbench to verify seed data |
| Logs not in Dynatrace | Add log source path in Dynatrace Settings → Log Monitoring |

---

## 📝 License

MIT — Built for Dynatrace learning and demonstration purposes.
