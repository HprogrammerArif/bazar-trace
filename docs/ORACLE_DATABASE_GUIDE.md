# Oracle Database Guide for Beginners

Complete guide to Oracle Database setup, connection, data visualization, and API integration.

---

## Table of Contents

1. [Oracle Database Basics](#oracle-database-basics)
2. [Local Installation](#local-installation)
3. [Connection Methods](#connection-methods)
4. [Visualization Tools](#visualization-tools)
5. [Basic SQL Operations](#basic-sql-operations)
6. [Viewing Your Data](#viewing-your-data)
7. [Creating API Endpoints](#creating-api-endpoints)
8. [Integration with Node.js Backend](#integration-with-nodejs-backend)
9. [Troubleshooting](#troubleshooting)

---

## Oracle Database Basics

### What is Oracle Database?

Oracle Database is a powerful **Relational Database Management System (RDBMS)** used to:

- Store large volumes of data
- Manage relationships between data
- Ensure data integrity and security
- Support complex queries and transactions
- Handle multiple users simultaneously

### Key Concepts

| Concept         | Description                                        |
| --------------- | -------------------------------------------------- |
| **Database**    | Container for all data and objects                 |
| **Tablespace**  | Storage structure for tables and indexes           |
| **Table**       | Container with rows and columns (like spreadsheet) |
| **Schema**      | Collection of objects owned by a user              |
| **Row**         | Single record in a table                           |
| **Column**      | Field that contains specific data type             |
| **Primary Key** | Unique identifier for each row                     |
| **Foreign Key** | Link between two tables                            |

---

## Local Installation

### For Windows

#### Step 1: Download Oracle Database Express Edition (Free)

1. Go to: https://www.oracle.com/xe/
2. Click "Download Oracle Database Express Edition"
3. Accept the license agreement
4. Download the Windows installer (about 2.8 GB)

#### Step 2: Install Oracle XE

1. Extract the downloaded file
2. Run `setup.exe` from the extracted folder
3. Follow the installation wizard:
   - Accept the license
   - Choose installation location (default is fine)
   - Set the **System Password** (remember this! You'll use it for admin)
   - Choose "Use Windows Administrator Privileges" or use a service account
   - Click Install
4. Wait for installation to complete (takes 10-30 minutes)

#### Step 3: Verify Installation

After installation:

- Oracle XE database automatically starts
- Default instance name: `XE`
- Default port: `1521`
- Default admin user: `SYS` or `SYSTEM`

### For macOS

```bash
# Using Homebrew (if installed)
brew tap oracle/oracle
brew install oracle-instantclient

# Or download directly from Oracle website:
# https://www.oracle.com/xe/
```

### For Linux

```bash
# Ubuntu/Debian
sudo apt-get install oracle-xe

# Or use Docker (recommended for Linux)
docker run -d --name oracle-xe \
  -p 1521:1521 \
  -e ORACLE_PWD=your_password \
  container-registry.oracle.com/database/express:latest
```

---

## Connection Methods

### Method 1: Direct Connection (SQL Plus)

#### Step 1: Find Oracle Installation Path

Windows default: `C:\app\[username]\product\21c\dbhomeXE\bin\`

#### Step 2: Connect Using SQL Plus

```bash
# Open command prompt and navigate to Oracle bin folder
cd C:\app\[username]\product\21c\dbhomeXE\bin

# Connect to database
sqlplus sys as sysdba
# Enter password when prompted
```

**Output:**

```
SQL*Plus: Release 21.0.0.0.0 - Production on Thu May 15 12:00:00 2026
Copyright (c) 1982, 2021, Oracle.  All rights reserved.

Enter password: ****
Connected to:
Oracle Database 21c Express Edition Release 21.0.0.0.0 - Production

SQL>
```

### Method 2: Connection String Format

```
[username]/[password]@[hostname]:[port]/[database_name]
```

**Example:**

```
sys/mypassword@localhost:1521/XE
```

### Method 3: Using Connection Descriptor (tnsnames.ora)

Create a connection in `tnsnames.ora` file:

**Location:**

- Windows: `C:\app\[username]\product\21c\dbhomeXE\network\admin\tnsnames.ora`
- macOS/Linux: `$ORACLE_HOME/network/admin/tnsnames.ora`

**Add this entry:**

```
MYDB =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = XE)
    )
  )
```

**Then connect:**

```bash
sqlplus sys/password@MYDB as sysdba
```

---

## Visualization Tools

### Tool 1: Oracle SQL Developer (Official - Free)

**Best for:** Complete IDE, native Oracle support

#### Installation:

1. Download: https://www.oracle.com/tools/downloads/sqldev-downloads.html
2. Extract the ZIP file
3. Run `sqldeveloper.exe` (or `sqldeveloper.sh` on Mac/Linux)

#### Create Connection:

1. Open SQL Developer
2. Go to View → Connections
3. Right-click → New Connection
4. Fill in details:
   - **Connection Name:** My Local DB
   - **Username:** SYSTEM (or SYS)
   - **Password:** your_password
   - **Hostname:** localhost
   - **Port:** 1521
   - **SID:** XE
5. Click Test → Success! → Save

#### Features:

- Write and execute SQL queries
- Browse tables and schemas
- View data visually
- Create/modify tables
- Export/import data
- View execution plans

### Tool 2: DBeaver (Free, Supports Multiple Databases)

**Best for:** Multi-database support, powerful features

#### Installation:

1. Download: https://dbeaver.io/download/
2. Run installer
3. Install

#### Create Connection:

1. File → New Database Connection
2. Select "Oracle"
3. Download driver (if needed)
4. Fill in details:
   - Host: localhost
   - Port: 1521
   - Database: XE
   - Username: SYSTEM
   - Password: your_password
5. Click Finish

### Tool 3: Toad for Oracle (Paid, but free trial)

**Best for:** Professional development

- Download: https://www.quest.com/toad/
- Free trial available
- Advanced debugging and profiling

### Tool 4: Oracle Enterprise Manager Express

**Built into Oracle XE - Free**

Access via browser:

```
https://localhost:5500/em
```

Login:

- Username: `SYS` or `SYSTEM`
- Password: your_password
- Login as: SYSDBA

---

## Basic SQL Operations

### 1. Create a Table

```sql
CREATE TABLE users (
    user_id NUMBER PRIMARY KEY,
    username VARCHAR2(50) NOT NULL,
    email VARCHAR2(100) UNIQUE,
    created_at TIMESTAMP DEFAULT SYSDATE
);
```

### 2. Insert Data

```sql
INSERT INTO users (user_id, username, email, created_at)
VALUES (1, 'john_doe', 'john@example.com', SYSDATE);

INSERT INTO users VALUES (2, 'jane_smith', 'jane@example.com', SYSDATE);
```

### 3. View Data (SELECT)

```sql
-- View all rows
SELECT * FROM users;

-- View specific columns
SELECT username, email FROM users;

-- With WHERE condition
SELECT * FROM users WHERE user_id = 1;

-- With ORDER BY
SELECT * FROM users ORDER BY username ASC;

-- With COUNT
SELECT COUNT(*) as total_users FROM users;
```

### 4. Update Data

```sql
UPDATE users
SET email = 'newemail@example.com'
WHERE user_id = 1;
```

### 5. Delete Data

```sql
DELETE FROM users WHERE user_id = 1;
```

### 6. View Table Structure

```sql
DESC users;
-- OR
DESCRIBE users;
```

### 7. Create an Index

```sql
CREATE INDEX idx_users_email ON users(email);
```

### 8. View All Tables

```sql
SELECT table_name FROM user_tables;
```

---

## Viewing Your Data

### Step-by-Step Guide Using SQL Developer

1. **Open SQL Developer**
   - Navigate to your connection in Connections panel
   - Double-click to connect

2. **Browse Tables**
   - Expand your connection → Expand Tables
   - Right-click table → View Data (or double-click)

3. **Execute Queries**
   - Click the SQL Editor icon or press Ctrl+Shift+F10
   - Write your SQL query:
     ```sql
     SELECT * FROM users;
     ```
   - Click Execute (F5 or green play button)
   - View results in grid below

4. **Export Data**
   - Right-click table → Export
   - Choose format: CSV, Excel, JSON, XML
   - Specify location and click Export

### Quick Reference Queries

```sql
-- Count total rows
SELECT COUNT(*) FROM users;

-- See first 10 rows
SELECT * FROM users FETCH FIRST 10 ROWS ONLY;

-- See table storage info
SELECT table_name, num_rows
FROM user_tables
ORDER BY num_rows DESC;

-- See all columns and data types
SELECT column_name, data_type
FROM user_tab_columns
WHERE table_name = 'USERS';
```

---

## Creating API Endpoints

Your Node.js backend can connect to Oracle and create REST API endpoints.

### Step 1: Install Oracle Driver for Node.js

In your `backend` folder:

```bash
npm install oracledb
```

### Step 2: Create Oracle Connection Module

Create file: `backend/src/config/oracle.js`

```javascript
const oracledb = require("oracledb");

// Initialize simple mode (basic connection)
oracledb.initOracleClient();

const dbConfig = {
  user: process.env.DB_USER || "SYSTEM",
  password: process.env.DB_PASSWORD || "your_password",
  connectString: process.env.DB_HOST || "localhost:1521/XE",
};

async function getConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    return connection;
  } catch (err) {
    console.error("Oracle Connection Error:", err);
    throw err;
  }
}

async function executeQuery(sql, bindParams = [], options = {}) {
  const connection = await getConnection();
  try {
    const result = await connection.execute(sql, bindParams, options);
    return result;
  } finally {
    await connection.close();
  }
}

module.exports = {
  getConnection,
  executeQuery,
  oracledb,
};
```

### Step 3: Create a Service Layer

Create file: `backend/src/modules/users/oracle-user.service.js`

```javascript
const { executeQuery } = require("../../config/oracle");

class UserService {
  async getAllUsers() {
    const sql = `SELECT * FROM users ORDER BY user_id`;
    const result = await executeQuery(sql);
    return result.rows;
  }

  async getUserById(userId) {
    const sql = `SELECT * FROM users WHERE user_id = :id`;
    const result = await executeQuery(sql, [userId]);
    return result.rows[0] || null;
  }

  async createUser(userData) {
    const { username, email } = userData;
    const sql = `
      INSERT INTO users (user_id, username, email, created_at)
      VALUES (users_seq.NEXTVAL, :username, :email, SYSDATE)
      RETURNING user_id INTO :userId
    `;

    const bindParams = {
      username,
      email,
      userId: { type: "NUMBER", dir: "OUT" },
    };

    const result = await executeQuery(sql, bindParams);
    return { userId: result.outBinds.userId[0], username, email };
  }

  async updateUser(userId, userData) {
    const { username, email } = userData;
    const sql = `
      UPDATE users 
      SET username = :username, email = :email 
      WHERE user_id = :id
    `;

    await executeQuery(sql, [username, email, userId]);
    return { userId, username, email };
  }

  async deleteUser(userId) {
    const sql = `DELETE FROM users WHERE user_id = :id`;
    await executeQuery(sql, [userId]);
    return { success: true };
  }
}

module.exports = new UserService();
```

### Step 4: Create API Routes

Create file: `backend/src/modules/users/oracle-user.routes.js`

```javascript
const express = require("express");
const userService = require("./oracle-user.service");
const asyncHandler = require("../../utils/async-handler");

const router = express.Router();

// GET all users
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  }),
);

// GET user by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  }),
);

// POST create user
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username and email required",
      });
    }

    const user = await userService.createUser({ username, email });
    res.status(201).json({ success: true, data: user });
  }),
);

// PUT update user
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: user });
  }),
);

// DELETE user
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  }),
);

module.exports = router;
```

### Step 5: Register Routes in App

In your `backend/src/app.js`:

```javascript
const userRoutes = require("./modules/users/oracle-user.routes");

// ... other middleware ...

app.use("/api/v1/oracle/users", userRoutes);
```

---

## Integration with Node.js Backend

### Updated Backend Architecture

```
backend/
├── src/
│   ├── config/
│   │   ├── oracle.js          ← Oracle connection config
│   │   └── database.js        ← Existing DB config
│   ├── modules/
│   │   ├── users/
│   │   │   ├── oracle-user.service.js    ← Business logic
│   │   │   ├── oracle-user.routes.js     ← API routes
│   │   │   ├── user.controller.js
│   │   │   └── user.routes.js
│   │   └── products/
│   │       ├── oracle-product.service.js
│   │       └── oracle-product.routes.js
│   └── app.js
```

### Environment Variables

Update your `.env` file:

```env
# Oracle Database Configuration
DB_USER=SYSTEM
DB_PASSWORD=your_oracle_password
DB_HOST=localhost:1521/XE

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Complete Example: Products API

**File:** `backend/src/modules/products/oracle-product.service.js`

```javascript
const { executeQuery } = require("../../config/oracle");

class ProductService {
  async getAll(limit = 10, offset = 0) {
    const sql = `
      SELECT * FROM products
      ORDER BY product_id
      OFFSET :offset ROWS
      FETCH NEXT :limit ROWS ONLY
    `;
    const result = await executeQuery(sql, [offset, limit]);
    return result.rows;
  }

  async getById(productId) {
    const sql = `SELECT * FROM products WHERE product_id = :id`;
    const result = await executeQuery(sql, [productId]);
    return result.rows[0] || null;
  }

  async searchByName(searchTerm) {
    const sql = `
      SELECT * FROM products 
      WHERE LOWER(product_name) LIKE LOWER(:term)
    `;
    const result = await executeQuery(sql, [`%${searchTerm}%`]);
    return result.rows;
  }

  async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_products,
        AVG(price) as avg_price,
        MAX(price) as max_price,
        MIN(price) as min_price
      FROM products
    `;
    const result = await executeQuery(sql);
    return result.rows[0];
  }
}

module.exports = new ProductService();
```

**File:** `backend/src/modules/products/oracle-product.routes.js`

```javascript
const express = require("express");
const productService = require("./oracle-product.service");
const asyncHandler = require("../../utils/async-handler");

const router = express.Router();

// GET all products with pagination
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const products = await productService.getAll(limit, offset);
    res.json({
      success: true,
      data: products,
      pagination: { limit, offset },
    });
  }),
);

// GET product by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  }),
);

// SEARCH products
router.get(
  "/search/products",
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ success: false, message: "Search query required" });
    }
    const results = await productService.searchByName(q);
    res.json({ success: true, data: results });
  }),
);

// GET statistics
router.get(
  "/stats/overview",
  asyncHandler(async (req, res) => {
    const stats = await productService.getStats();
    res.json({ success: true, data: stats });
  }),
);

module.exports = router;
```

### Testing API Endpoints

Using cURL or Postman:

```bash
# Get all products
curl http://localhost:3000/api/v1/oracle/products?limit=5

# Get specific product
curl http://localhost:3000/api/v1/oracle/products/1

# Search products
curl "http://localhost:3000/api/v1/oracle/products/search/products?q=laptop"

# Get statistics
curl http://localhost:3000/api/v1/oracle/products/stats/overview
```

---

## Troubleshooting

### Connection Issues

**Problem:** "ORA-12514: TNS:listener does not know the service"

**Solution:**

```bash
# 1. Check if Oracle is running
sqlplus sys/password as sysdba

# 2. Verify connection string
# Default: localhost:1521/XE

# 3. Check tnsnames.ora file syntax
```

**Problem:** "ORA-01017: invalid username/password"

**Solution:**

```bash
# 1. Verify credentials
# Default user: SYSTEM
# Default password: Set during installation

# 2. Reset password (as admin)
sqlplus sys/password as sysdba
ALTER USER SYSTEM IDENTIFIED BY newpassword;
```

### Driver Issues

**Problem:** "Cannot find module 'oracledb'"

**Solution:**

```bash
npm install oracledb
# If still fails, install build tools
npm install --g windows-build-tools  # Windows
brew install python@3.11            # macOS
```

**Problem:** "ORACLE_HOME not set"

**Solution:**

- Windows: Environment variable already set during installation
- macOS/Linux: Add to `~/.bash_profile`:
  ```bash
  export ORACLE_HOME=/path/to/oracle
  export PATH=$ORACLE_HOME/bin:$PATH
  ```

### Data Visibility Issues

**Problem:** "Cannot see tables created by other users"

**Solution:**

```sql
-- List all tables including others
SELECT table_name FROM dba_tables;

-- Or look at specific schema
SELECT table_name FROM all_tables WHERE owner = 'SYSTEM';
```

**Problem:** "No data appears in visualization tool"

**Solution:**

1. Verify connection is active
2. Ensure correct schema is selected
3. Check if table has data:
   ```sql
   SELECT COUNT(*) FROM table_name;
   ```

### Query Performance

**Problem:** "Queries running slow"

**Solution:**

```sql
-- Create index on frequently searched columns
CREATE INDEX idx_column_name ON table_name(column_name);

-- Check execution plan
EXPLAIN PLAN FOR SELECT * FROM users WHERE email = 'test@test.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

---

## Quick Reference Commands

| Task               | Command                                             |
| ------------------ | --------------------------------------------------- |
| Connect to DB      | `sqlplus sys/password as sysdba`                    |
| Show all tables    | `SELECT table_name FROM user_tables;`               |
| Show table columns | `DESC table_name;`                                  |
| Show table data    | `SELECT * FROM table_name;`                         |
| Count rows         | `SELECT COUNT(*) FROM table_name;`                  |
| Create table       | `CREATE TABLE name (id NUMBER, name VARCHAR2(50));` |
| Add data           | `INSERT INTO table_name VALUES (...);`              |
| Update data        | `UPDATE table_name SET col=value WHERE condition;`  |
| Delete data        | `DELETE FROM table_name WHERE condition;`           |
| Create index       | `CREATE INDEX idx_name ON table_name(column);`      |
| View index         | `SELECT * FROM user_indexes;`                       |
| Commit changes     | `COMMIT;`                                           |
| Rollback changes   | `ROLLBACK;`                                         |

---

## Resources

- **Official Oracle Docs:** https://docs.oracle.com
- **Oracle SQL Tutorial:** https://www.oracletutorial.com/
- **oracledb npm package:** https://github.com/oracle/node-oracledb
- **SQL Developer Download:** https://www.oracle.com/tools/downloads/sqldev-downloads.html
- **DBeaver Download:** https://dbeaver.io/download/

---

## Next Steps

1. ✅ Install Oracle Database Express Edition
2. ✅ Install visualization tool (SQL Developer or DBeaver)
3. ✅ Connect and verify the connection
4. ✅ Create sample tables
5. ✅ Install oracledb driver in backend
6. ✅ Create Oracle connection config
7. ✅ Build API services and routes
8. ✅ Test API endpoints

---

**Last Updated:** May 15, 2026
