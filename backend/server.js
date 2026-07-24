require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let poolPromise = null;
let isConnected = false;

const connectToDatabase = async (config) => {
    try {
        const pool = await sql.connect(config);
        console.log('Connected to MSSQL Database successfully.');
        isConnected = true;
        poolPromise = pool;
        return pool;
    } catch (err) {
        console.error('Database Connection Failed! Bad Config: ', err.message);
        isConnected = false;
        poolPromise = null;
        throw err;
    }
};

const getDbConfigFromEnv = () => ({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: { encrypt: false, trustServerCertificate: true }
});

// Initial connection attempt on startup (doesn't crash if it fails)
connectToDatabase(getDbConfigFromEnv()).catch(() => {
    console.log("Will wait for new configuration via /api/connect.");
});

// Helper middleware to check connection before querying
const requireDb = async (req, res, next) => {
    if (!isConnected || !poolPromise) {
        return res.status(503).json({ message: "Database is not connected." });
    }
    req.pool = poolPromise;
    next();
};

// -----------------
// SETTINGS ROUTES
// -----------------

app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        server: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        user: process.env.DB_USER
    });
});

app.post('/api/connect', async (req, res) => {
    const { server, port, database, user, password } = req.body;
    
    const newConfig = {
        user,
        password,
        database,
        server,
        port: parseInt(port || '1433', 10),
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        options: { encrypt: false, trustServerCertificate: true }
    };

    try {
        // Try connecting
        await connectToDatabase(newConfig);

        // If successful, save to .env
        const envPath = path.join(__dirname, '.env');
        const envContent = `DB_SERVER=${server}
DB_PORT=${port}
DB_DATABASE=${database}
DB_USER=${user}
DB_PASSWORD=${password}
PORT=${process.env.PORT || 5000}`;
        
        fs.writeFileSync(envPath, envContent);

        // Update process.env so it's fresh
        process.env.DB_SERVER = server;
        process.env.DB_PORT = port;
        process.env.DB_DATABASE = database;
        process.env.DB_USER = user;
        process.env.DB_PASSWORD = password;

        res.json({ message: "Connection successful and settings saved." });
    } catch (err) {
        res.status(500).json({ message: "Failed to connect with these credentials: " + err.message });
    }
});


// -----------------
// ASSETS ROUTES
// -----------------

app.get('/api/assets', requireDb, async (req, res) => {
    try {
        const result = await req.pool.request().query('SELECT * FROM assets');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/assets', requireDb, async (req, res) => {
    const { tag, serial_number, name, category, model, specs, location, status, remarks } = req.body;
    try {
        await req.pool.request()
            .input('tag', sql.VarChar, tag)
            .input('serial_number', sql.VarChar, serial_number)
            .input('name', sql.VarChar, name)
            .input('category', sql.VarChar, category)
            .input('model', sql.VarChar, model)
            .input('specs', sql.VarChar, specs)
            .input('location', sql.VarChar, location)
            .input('status', sql.VarChar, status || 'Available')
            .input('remarks', sql.VarChar, remarks)
            .query(`
                INSERT INTO assets (tag, serial_number, name, category, model, specs, location, status, remarks)
                VALUES (@tag, @serial_number, @name, @category, @model, @specs, @location, @status, @remarks)
            `);
        res.status(201).send({ message: 'Asset created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// EMPLOYEES ROUTES
// -----------------

app.get('/api/employees', requireDb, async (req, res) => {
    try {
        const result = await req.pool.request().query('SELECT * FROM employees');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/employees', requireDb, async (req, res) => {
    const { id, name, department, designation } = req.body;
    try {
        await req.pool.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('department', sql.VarChar, department)
            .input('designation', sql.VarChar, designation)
            .query(`
                INSERT INTO employees (id, name, department, designation)
                VALUES (@id, @name, @department, @designation)
            `);
        res.status(201).send({ message: 'Employee created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// ASSIGNMENTS ROUTES
// -----------------

app.get('/api/assignments', requireDb, async (req, res) => {
    try {
        const result = await req.pool.request().query(`
            SELECT a.*, asst.tag as assetTag, asst.model as model, emp.name as employee
            FROM assignments a
            JOIN assets asst ON a.asset_id = asst.id
            JOIN employees emp ON a.employee_id = emp.id
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// TRANSFERS & RETURNS ROUTES
// -----------------

app.get('/api/transfers', requireDb, async (req, res) => {
    try {
        const result = await req.pool.request().query('SELECT * FROM transfers');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/api/returns', requireDb, async (req, res) => {
    try {
        const result = await req.pool.request().query('SELECT * FROM [returns]');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
