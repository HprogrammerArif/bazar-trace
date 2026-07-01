# 🐳 Docker + Oracle Database — Complete Beginner's Guide
### For Your **Bazar-Trace** University Project

> This guide teaches you everything from zero. By the end you will understand Docker, Oracle, and be able to run your full project with a single command.

---

## Table of Contents

1. [What Problem Does Docker Solve?](#1-what-problem-does-docker-solve)
2. [Core Concepts — The Mental Model](#2-core-concepts--the-mental-model)
3. [Docker Desktop & Docker Hub](#3-docker-desktop--docker-hub)
4. [Installing Docker on Windows](#4-installing-docker-on-windows)
5. [Your First Docker Commands](#5-your-first-docker-commands)
6. [Understanding Dockerfile](#6-understanding-dockerfile)
7. [Understanding Docker Compose](#7-understanding-docker-compose)
8. [Understanding Docker Volumes](#8-understanding-docker-volumes)
9. [Oracle Database 101](#9-oracle-database-101)
10. [How Bazar-Trace Uses All of This](#10-how-bazar-trace-uses-all-of-this)
11. [Step-by-Step: Run Bazar-Trace with Docker](#11-step-by-step-run-bazar-trace-with-docker)
12. [Common Commands Cheat Sheet](#12-common-commands-cheat-sheet)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. What Problem Does Docker Solve?

### The "Works on My Machine" Problem

Imagine you write code on your laptop. Your friend runs the same code on their laptop — it crashes. Why? Because their laptop has a different version of Node.js, different OS settings, different Oracle client installed.

**Docker fixes this** by bundling your code together with its entire environment (OS, runtime, libraries, config) into a single self-contained **"box"** called a **container**. That box runs identically everywhere — your laptop, your university lab, a cloud server.

```
Without Docker:                   With Docker:
──────────────                    ──────────────
Your Laptop (Windows 11)          Container A (Oracle DB)
└── Oracle 19c installed          Container B (Node.js Backend)
Your Friend's Laptop (Ubuntu)     Container C (Nginx Frontend)
└── Oracle not installed ❌       All three talk to each other ✅
```

### Real benefit for your project:
Instead of installing Oracle Database (a complex 5 GB enterprise database) on your machine, you just run it as a **Docker container** — no installation headaches.

---

## 2. Core Concepts — The Mental Model

Think of Docker like a **shipping industry analogy**:

| Docker Term     | Real World Analogy               | What It Actually Is |
|-----------------|----------------------------------|---------------------|
| **Image**       | A blueprint / mold               | A read-only template that describes what the container will contain |
| **Container**   | A running instance from the mold | A live, isolated process created from an image |
| **Dockerfile**  | The recipe to build an image     | A text file with instructions to create your own image |
| **Docker Hub**  | A supermarket of images          | An online registry where images are stored & shared |
| **Volume**      | A USB drive attached to a box    | Persistent storage that survives container restarts |
| **Network**     | A LAN cable between boxes        | A virtual network letting containers talk to each other |
| **Docker Compose** | A conductor for many boxes    | A tool that starts/stops multiple containers together |

### Image vs Container — Key Difference

```
IMAGE  (Blueprint)          CONTAINER  (Running thing)
──────────────────          ─────────────────────────
oracle-xe:21-slim  ──────►  Oracle DB running on port 1521
       │           ──────►  Another Oracle DB running on port 1522
       │           ──────►  A third one (all independent!)
One image → Many containers
```

An **image** is static (like a class in programming). A **container** is a live running instance (like an object). You can create many containers from one image.

---

## 3. Docker Desktop & Docker Hub

### Docker Hub — The App Store for Images

**URL:** https://hub.docker.com

Docker Hub is a free online registry (like GitHub but for Docker images). People publish ready-made images there. You can:
- Search for any software image: `oracle`, `node`, `nginx`, `postgres`
- Pull (download) an image to your machine
- Push (upload) your own image

**For your project, you use these images from Docker Hub:**
- `gvenzl/oracle-xe:21-slim` — Oracle Database 21c Express Edition (slim version)
- `node:20-alpine` — Node.js 20 on a tiny Alpine Linux
- `nginx:alpine` — Nginx web server (serves your React app)

### Docker Desktop — The GUI App

Docker Desktop is the application you install on Windows/Mac. It provides:
- A **graphical interface** to see containers, images, volumes
- The **Docker Engine** (the actual runtime) running in the background
- A **terminal integration** so you can type `docker` commands anywhere

```
Docker Desktop
├── Dashboard tab  → See all running containers
├── Images tab     → All images downloaded on your machine
├── Volumes tab    → All persistent data volumes
└── Dev Environments (ignore this for now)
```

---

## 4. Installing Docker on Windows

### Prerequisites
- Windows 10/11 (64-bit)
- At least **8 GB RAM** (Oracle needs ~2 GB alone)
- Virtualization enabled in BIOS (usually already is)

### Steps

**Step 1:** Go to https://www.docker.com/products/docker-desktop and download **Docker Desktop for Windows**.

**Step 2:** Run the installer. Accept all defaults. It will ask to enable **WSL 2** (Windows Subsystem for Linux 2) — say **Yes**. This is important.

**Step 3:** Restart your computer when asked.

**Step 4:** Open Docker Desktop. Wait for it to show "Docker Desktop is running" in the taskbar.

**Step 5:** Open PowerShell or CMD and verify:
```powershell
docker --version
# Docker version 26.x.x, build xxxxxxx

docker compose version
# Docker Compose version v2.x.x
```

If both commands work, you're ready! ✅

---

## 5. Your First Docker Commands

Open PowerShell and try these one by one:

### Pull an Image
```powershell
# Download the official "hello-world" image from Docker Hub
docker pull hello-world
```

### Run a Container
```powershell
# Create and run a container from that image
docker run hello-world
# You'll see a congratulations message, then the container stops
```

### Run an Interactive Container
```powershell
# Run Ubuntu Linux inside a container, with a terminal
docker run -it ubuntu bash
# Now you're INSIDE the container! Type 'ls', 'pwd', etc.
# Type 'exit' to leave
```

### List Running Containers
```powershell
docker ps
# Shows only running containers

docker ps -a
# Shows ALL containers (including stopped ones)
```

### List Downloaded Images
```powershell
docker images
# NAME          TAG       IMAGE ID       CREATED        SIZE
# hello-world   latest    ...            ...            13.3kB
# ubuntu        latest    ...            ...            77.8MB
```

### Stop and Remove a Container
```powershell
docker stop <container-id-or-name>
docker rm <container-id-or-name>

# Or force remove in one command:
docker rm -f <container-name>
```

### Remove an Image
```powershell
docker rmi hello-world
```

---

## 6. Understanding Dockerfile

A **Dockerfile** is a recipe file. It tells Docker: "Here is how to build my custom image."

### Syntax Overview

```dockerfile
# Start from a base image (FROM is always first)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy files from your computer into the container
COPY package*.json ./

# Run commands during image build
RUN npm ci --omit=dev

# Copy rest of source code
COPY src ./src

# Set an environment variable
ENV NODE_ENV=production

# Tell Docker which port this app uses (documentation only)
EXPOSE 5000

# The command to run when the container starts
CMD ["node", "src/server.js"]
```

### Your Backend's Dockerfile Explained

File: [`backend/Dockerfile`](file:///d:/UNIVERSITY/versity-project/bazar/backend/Dockerfile)

```dockerfile
FROM node:20-alpine        # ← Use a tiny Linux with Node.js 20 pre-installed

WORKDIR /app               # ← All commands run inside /app directory

COPY package*.json ./      # ← Copy package.json first (for caching)
RUN npm ci --omit=dev      # ← Install production dependencies only

COPY src ./src             # ← Copy your actual source code

ENV NODE_ENV=production    # ← Set environment to production
EXPOSE 5000                # ← Document that port 5000 is used

CMD ["node", "src/server.js"]  # ← Start the server when container launches
```

> **Why copy package.json first, then code?** Docker caches each step. If your code changes but package.json doesn't, Docker skips the slow `npm install` step and uses the cached layer. This makes rebuilds much faster.

### Your Frontend's Dockerfile Explained

File: [`frontend/Dockerfile`](file:///d:/UNIVERSITY/versity-project/bazar/frontend/Dockerfile)

```dockerfile
# ── Stage 1: Build ──────────────────────────────────
FROM node:20-alpine AS build   # ← Named "build" stage
WORKDIR /app
COPY package*.json ./
RUN npm ci                     # ← Install ALL deps (including dev)
COPY . .
RUN npm run build              # ← Build React app → produces /app/dist

# ── Stage 2: Serve ──────────────────────────────────
FROM nginx:alpine              # ← Start fresh with tiny Nginx image
COPY --from=build /app/dist /usr/share/nginx/html  # ← Copy built files
COPY nginx.conf /etc/nginx/conf.d/default.conf     # ← Copy Nginx config
EXPOSE 80                      # ← Nginx listens on port 80
```

> This is called a **Multi-Stage Build**. The final image is tiny because it only contains Nginx + static files, NOT Node.js, npm, or source code.

---

## 7. Understanding Docker Compose

Running each container manually with `docker run` becomes tedious when you have multiple services. **Docker Compose** lets you define ALL your services in one YAML file and start them with one command.

### YAML Basics (very quick)

YAML is a human-readable config format. Rules:
- **Indentation matters** (use spaces, not tabs)
- `key: value` pairs
- `-` means list item
- `#` is a comment

### Your docker-compose.yml Fully Explained

File: [`docker-compose.yml`](file:///d:/UNIVERSITY/versity-project/bazar/docker-compose.yml)

```yaml
# "services" is the list of containers to run
services:

  # ── Service 1: Oracle Database ───────────────────────────────────────
  oracle:                                    # ← Name of this service (used for networking)
    image: gvenzl/oracle-xe:21-slim          # ← Pull this image from Docker Hub
    environment:                             # ← Environment variables passed to the container
      ORACLE_PASSWORD: oracle                # ← Password for the built-in SYS/SYSTEM admin account
      APP_USER: bazar_user                   # ← Creates this DB user automatically on first boot
      APP_USER_PASSWORD: bazar_pass          # ← Password for bazar_user
    ports:
      - "1521:1521"                          # ← "hostPort:containerPort" — maps your PC's 1521 to container's 1521
    healthcheck:                             # ← Docker checks if Oracle is actually ready
      test: ["CMD", "healthcheck.sh"]        # ← Run this script to check health
      interval: 30s                          # ← Check every 30 seconds
      timeout: 10s                           # ← Wait max 10 seconds for response
      retries: 10                            # ← Try 10 times before marking as unhealthy
    volumes:
      - oracle-data:/opt/oracle/oradata      # ← Save DB data to a named volume (persistent!)

  # ── Service 2: Node.js Backend ───────────────────────────────────────
  backend:
    build: ./backend                         # ← Build image from ./backend/Dockerfile
    depends_on:
      oracle:
        condition: service_healthy           # ← Don't start backend UNTIL Oracle is healthy
    environment:
      NODE_ENV: production
      PORT: 5000
      JWT_SECRET: ${JWT_SECRET:-replace-me-in-prod-please-make-it-long}  # ← Reads from .env file or uses default
      ORACLE_ENABLED: "true"
      ORACLE_USER: bazar_user
      ORACLE_PASSWORD: bazar_pass
      ORACLE_CONNECT_STRING: oracle:1521/XEPDB1  # ← "oracle" here is the SERVICE NAME above! Docker resolves it.
      CORS_ORIGIN: http://localhost:8080
    ports:
      - "5000:5000"

  # ── Service 3: React Frontend ─────────────────────────────────────────
  frontend:
    build: ./frontend                        # ← Build image from ./frontend/Dockerfile
    depends_on:
      - backend                              # ← Start after backend is up
    ports:
      - "8080:80"                            # ← Map your PC's port 8080 to Nginx's port 80

# ── Named Volumes ─────────────────────────────────────────────────────
volumes:
  oracle-data:                               # ← Declares a named volume (Docker manages its location)
```

### How Containers Talk to Each Other

All services in a `docker-compose.yml` are automatically on the **same Docker network**. They can reach each other by **service name**.

```
Your PC (localhost)              Docker Network (internal)
──────────────────               ────────────────────────
:8080  ──────────►  frontend  ──► backend:5000  ──► oracle:1521
:5000  ──────────►  backend   
:1521  ──────────►  oracle    
```

When the backend sets `ORACLE_CONNECT_STRING: oracle:1521/XEPDB1`, the hostname `oracle` resolves to the Oracle container. Docker handles DNS internally.

---

## 8. Understanding Docker Volumes

A **container is ephemeral** — when you remove it, all data inside is lost. This is a problem for a database!

**Volumes** are the solution. They are storage areas managed by Docker that exist **outside** the container lifecycle.

```
Container removed ──► Container data LOST
Volume removed    ──► Volume data LOST (but volumes survive container restarts!)
```

### Types of Storage

| Type          | Syntax Example                      | Use Case |
|---------------|-------------------------------------|----------|
| **Named Volume** | `oracle-data:/opt/oracle/oradata` | Persistent data (databases) — Docker manages location |
| **Bind Mount**   | `./mycode:/app`                   | Development — your local folder inside container |
| **tmpfs**        | `type: tmpfs`                     | Temporary data in RAM only |

### In Your Project

```yaml
volumes:
  oracle-data:  # ← Declared at the bottom

# And used in the oracle service:
volumes:
  - oracle-data:/opt/oracle/oradata
```

This means: Oracle stores its data files in Docker's managed volume `oracle-data`. Even if you stop and restart the Oracle container, all your database tables and data survive.

### Volume Commands
```powershell
docker volume ls                    # List all volumes
docker volume inspect oracle-data   # See where data is stored
docker volume rm oracle-data        # DELETE volume (WARNING: loses all DB data!)
```

---

## 9. Oracle Database 101

### What is Oracle XE?

Oracle Database is a powerful relational database (like MySQL/PostgreSQL but enterprise-grade). **XE** stands for **Express Edition** — it's the free version with limits:
- Max **2 CPU threads**
- Max **2 GB RAM**
- Max **12 GB** of user data

Perfect for university projects!

### Key Oracle Concepts

| Term | Meaning |
|------|---------|
| **Instance** | The running Oracle database process |
| **PDB (Pluggable Database)** | A self-contained database inside Oracle. Your data lives in `XEPDB1` |
| **CDB** | Container Database — the outer shell holding PDBs |
| **SYS/SYSTEM** | Built-in admin accounts |
| **bazar_user** | Your application's database user (created by the Docker image automatically) |
| **Schema** | All tables/views/sequences owned by a user |
| **Port 1521** | Oracle's default listener port |
| **XEPDB1** | The default PDB name in Oracle XE |

### Connection String Explained

```
oracle:1521/XEPDB1
  │      │    │
  │      │    └── Pluggable Database name (your actual database)
  │      └─────── Port Oracle listens on
  └────────────── Hostname (service name in Docker network)
```

### Oracle SQL Basics (what your project uses)

```sql
-- Create a table
CREATE TABLE products (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(200) NOT NULL,
    price NUMBER(10,2)
);

-- Insert a row
INSERT INTO products (name, price) VALUES ('Rice 1kg', 85.00);

-- Query rows
SELECT * FROM products;

-- Update
UPDATE products SET price = 90.00 WHERE id = 1;

-- Delete
DELETE FROM products WHERE id = 1;

-- Commit changes (Oracle requires this!)
COMMIT;
```

> **Key Oracle difference from MySQL:** Oracle requires `COMMIT;` to save changes. Without it, changes are only in your session.

---

## 10. How Bazar-Trace Uses All of This

Here is how your three-tier architecture maps to Docker:

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Windows PC                          │
│                                                             │
│  Browser → http://localhost:8080                            │
│     │                                                       │
│  ┌──▼──────────────────────────────────────────────────┐   │
│  │              Docker Desktop (WSL2)                   │   │
│  │                                                      │   │
│  │  ┌─────────────────┐                                 │   │
│  │  │  frontend        │  container: nginx:alpine       │   │
│  │  │  port 8080:80   │  serves React PWA static files │   │
│  │  └────────┬────────┘                                 │   │
│  │           │ /api/* requests proxied to backend:5000  │   │
│  │  ┌────────▼────────┐                                 │   │
│  │  │  backend         │  container: node:20-alpine     │   │
│  │  │  port 5000:5000 │  Express REST API               │   │
│  │  └────────┬────────┘                                 │   │
│  │           │ SQL queries via oracledb npm package     │   │
│  │  ┌────────▼────────┐                                 │   │
│  │  │  oracle          │  container: gvenzl/oracle-xe   │   │
│  │  │  port 1521:1521 │  Oracle 21c XE database         │   │
│  │  └────────┬────────┘                                 │   │
│  │           │                                          │   │
│  │  ┌────────▼────────┐                                 │   │
│  │  │  oracle-data     │  Docker Volume (persistent)    │   │
│  │  │  (volume)       │  All DB files live here         │   │
│  │  └─────────────────┘                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Startup Sequence (depends_on)

Docker Compose starts services in this order because of `depends_on`:
1. **Oracle** starts first and runs health checks (takes ~3-5 minutes first time)
2. **Backend** starts only after Oracle passes health check
3. **Frontend** starts after Backend is up

---

## 11. Step-by-Step: Run Bazar-Trace with Docker

### Prerequisites Checklist
- [ ] Docker Desktop installed and running (green icon in taskbar)
- [ ] At least 8 GB RAM free
- [ ] Good internet connection (first run downloads ~2 GB of images)

---

### Step 1: Open PowerShell in Project Directory

```powershell
cd d:\UNIVERSITY\versity-project\bazar
```

### Step 2: Check Docker is Running

```powershell
docker ps
# Should show empty table, not an error
```

### Step 3: First-Time Setup — Pull Oracle Image

This downloads the Oracle image (~500 MB) in advance:
```powershell
docker pull gvenzl/oracle-xe:21-slim
```
You'll see a progress bar. Wait for it to complete.

### Step 4: Start Everything

```powershell
docker compose up -d --build
```

**What each flag means:**
- `up` — Create and start containers
- `-d` — Detached mode (runs in background, doesn't block your terminal)
- `--build` — Rebuild backend and frontend images from their Dockerfiles

**First run output looks like:**
```
[+] Running 3/3
 ✔ Network bazar_default    Created
 ✔ Volume "bazar_oracle-data" Created
 ✔ Container bazar-oracle-1  Started
 ✔ Container bazar-backend-1 Starting...
 ✔ Container bazar-frontend-1 Starting...
```

### Step 5: Wait for Oracle to Initialize

Oracle takes **3-5 minutes** on first boot. Monitor it:

```powershell
# Watch Oracle logs in real time (press Ctrl+C to stop watching)
docker compose logs -f oracle
```

You're waiting to see this message:
```
DATABASE IS READY TO USE!
```

### Step 6: Run Database Migrations

Once Oracle is ready, run the backend migrations:

```powershell
# Run migrations inside the backend container
docker compose exec backend npm run db:migrate
```

> `exec` runs a command inside an already-running container.

### Step 7: Check Container Status

```powershell
docker compose ps
```

Output should show all services as **running** or **healthy**:
```
NAME               IMAGE                    STATUS
bazar-oracle-1     gvenzl/oracle-xe:21-slim running (healthy)
bazar-backend-1    bazar-backend            running
bazar-frontend-1   bazar-frontend           running
```

### Step 8: Access Your Application

| Service  | URL                            |
|----------|--------------------------------|
| Frontend | http://localhost:8080           |
| Backend  | http://localhost:5000/api/v1/health |
| Oracle   | localhost:1521 (port open)      |

Open your browser → go to **http://localhost:8080** 🎉

### Step 9: Seed Admin User

To log into the app, create the first admin:

```powershell
docker compose exec backend npm run db:seed:admin
```

Default credentials (from `.env.example`):
- **Email:** `admin@bazar-trace.local`
- **Password:** `Admin@123`

### Step 10: Stopping the Project

```powershell
# Stop all containers (data is preserved in volume)
docker compose down

# Start again later (Oracle boots in ~30 seconds this time):
docker compose up -d
```

> ⚠️ **DO NOT run `docker compose down -v`** — the `-v` flag deletes volumes and you'll lose all your database data!

---

## 12. Common Commands Cheat Sheet

### Starting & Stopping
```powershell
docker compose up -d            # Start all services in background
docker compose up -d --build    # Rebuild images, then start
docker compose down             # Stop and remove containers (keeps volumes)
docker compose down -v          # ⚠️ Stop AND delete all volumes (loses DB data!)
docker compose restart backend  # Restart just one service
```

### Monitoring
```powershell
docker compose ps               # Status of all services
docker compose logs             # Logs from all services
docker compose logs oracle      # Logs from Oracle only
docker compose logs -f backend  # Follow/stream backend logs live
docker stats                    # Live resource usage (CPU, RAM, Network)
```

### Running Commands Inside Containers
```powershell
docker compose exec backend npm run db:migrate   # Run migrations
docker compose exec backend npm run db:seed      # Seed data
docker compose exec oracle bash                  # Enter Oracle container shell
docker compose exec backend sh                   # Enter backend container shell
```

### Connecting to Oracle DB Manually
```powershell
# Open SQL*Plus inside the Oracle container
docker compose exec oracle sqlplus bazar_user/bazar_pass@XEPDB1

# Once connected, run SQL:
# SQL> SELECT table_name FROM user_tables;
# SQL> exit
```

### Cleanup Commands
```powershell
docker image prune -f           # Remove unused images
docker system prune -f          # Remove ALL unused resources (keeps volumes)
docker volume ls                # List all volumes
docker volume inspect bazar_oracle-data  # Inspect volume details
```

### Rebuild Single Service
```powershell
# If you change backend code:
docker compose build backend
docker compose up -d backend

# Or shortcut:
docker compose up -d --build backend
```

---

## 13. Troubleshooting

### ❌ "Docker daemon is not running"
**Fix:** Open Docker Desktop app and wait for it to fully start (green taskbar icon).

---

### ❌ Oracle container keeps restarting
```powershell
docker compose logs oracle  # Read the error
```
**Common causes:**
- Not enough RAM → Close other apps, free up memory
- Port 1521 already in use → Check if another Oracle is installed locally

---

### ❌ Backend shows "ORA-12541: No listener"
**Fix:** Oracle isn't ready yet. Wait for it to be healthy:
```powershell
docker compose logs -f oracle  # Wait for "DATABASE IS READY"
```

---

### ❌ "Port 1521 is already allocated"
Another process is using port 1521 (maybe local Oracle installation).
```powershell
# Find what's using port 1521
netstat -aon | findstr :1521

# Kill it (replace PID with actual PID number)
taskkill /PID <PID> /F
```
Or change the port in `docker-compose.yml`: `"1522:1521"` and update `ORACLE_CONNECT_STRING: oracle:1521/XEPDB1` (internal port stays 1521).

---

### ❌ Frontend shows blank page or API errors
```powershell
docker compose logs frontend   # Check Nginx errors
docker compose logs backend    # Check API errors
```
Also verify the backend health endpoint:
```powershell
curl http://localhost:5000/api/v1/health
```

---

### ❌ Want to reset everything from scratch
```powershell
docker compose down -v         # Removes containers + volumes (ALL data gone)
docker compose up -d --build   # Start fresh
# Wait for Oracle, then run migrations and seed again
```

---

### ❌ "no space left on device" inside Docker
```powershell
docker system prune -a -f     # Clean up everything unused
```

---

## Quick Reference — What Each File Does

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](file:///d:/UNIVERSITY/versity-project/bazar/docker-compose.yml) | Orchestrates all 3 containers (oracle, backend, frontend) |
| [`backend/Dockerfile`](file:///d:/UNIVERSITY/versity-project/bazar/backend/Dockerfile) | Builds the Node.js backend image |
| [`frontend/Dockerfile`](file:///d:/UNIVERSITY/versity-project/bazar/frontend/Dockerfile) | Builds the React + Nginx frontend image |
| [`backend/.env.example`](file:///d:/UNIVERSITY/versity-project/bazar/backend/.env.example) | Template for environment variables |

---

## Summary of the Full Picture

```
Docker Hub (internet)
   └── gvenzl/oracle-xe:21-slim  ← pulled automatically
   └── node:20-alpine            ← used as base for backend image
   └── nginx:alpine              ← used as base for frontend image

Your Project Files
   └── backend/Dockerfile  ──builds──►  backend image
   └── frontend/Dockerfile ──builds──►  frontend image

docker-compose.yml
   └── Starts oracle    (from Docker Hub image)
   └── Starts backend   (from your backend Dockerfile)
   └── Starts frontend  (from your frontend Dockerfile)
   └── Creates oracle-data volume (for persistent DB storage)
   └── Creates a shared Docker network (so they can talk to each other)
```

**The single command that does everything:**
```powershell
docker compose up -d --build
```

That's it! Docker downloads, builds, configures, and starts your entire university project stack automatically. 🚀
