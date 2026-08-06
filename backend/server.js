require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let poolPromise = null;
let isConnected = false;

const connectToDatabase = async (config) => {
    try {
        const pool = mysql.createPool(config);
        // Test connection
        await pool.getConnection();
        console.log('Connected to MySQL Database successfully.');
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
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ats_db',
    host: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
        server: process.env.DB_SERVER || 'localhost',
        port: process.env.DB_PORT || '3306',
        database: process.env.DB_DATABASE || 'ats_db',
        user: process.env.DB_USER || 'root'
    });
});

app.post('/api/connect', async (req, res) => {
    const { server, port, database, user, password } = req.body;
    
    const newConfig = {
        user,
        password: password || '',
        database,
        host: server,
        port: parseInt(port || '3306', 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
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
DB_PASSWORD=${password || ''}
PORT=${process.env.PORT || 5000}`;
        
        fs.writeFileSync(envPath, envContent);

        // Update process.env so it's fresh
        process.env.DB_SERVER = server;
        process.env.DB_PORT = port;
        process.env.DB_DATABASE = database;
        process.env.DB_USER = user;
        process.env.DB_PASSWORD = password || '';

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
        const [rows] = await req.pool.query('SELECT * FROM assets');
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/assets', requireDb, async (req, res) => {
    const { tag, serial_number, name, category, model, brand, specs, location, status, remarks } = req.body;
    
    // Convert undefined to null for mysql2, and map brand to model if model is missing
    const assetModel = model || brand || null;
    const assetSerialNumber = serial_number || null;
    const assetCategory = category || null;
    
    try {
        await req.pool.execute(`
            INSERT INTO assets (tag, serial_number, name, category, model, specs, location, status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tag || null, 
            assetSerialNumber, 
            name || null, 
            assetCategory, 
            assetModel, 
            specs || null, 
            location || null, 
            status || 'Available', 
            remarks || null
        ]);
        res.status(201).send({ message: 'Asset created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/assets/bulk', requireDb, async (req, res) => {
    const { assets } = req.body;
    if (!assets || !Array.isArray(assets)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        for (const asset of assets) {
            const assetModel = asset.model || asset.brand || null;
            await req.pool.execute(`
                INSERT INTO assets (tag, serial_number, name, category, model, specs, location, status, remarks)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                asset.tag || null, 
                asset.serialNumber || asset.serial_number || null, 
                asset.name || null, 
                asset.category || null, 
                assetModel, 
                asset.specs || null, 
                asset.location || null, 
                asset.status || 'Available', 
                asset.remarks || null
            ]);
        }
        res.status(201).send({ message: 'Assets imported successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/assets/:id', requireDb, async (req, res) => {
    const { id } = req.params;
    const { tag, serial_number, name, category, model, brand, specs, location, status, remarks } = req.body;
    const assetModel = model || brand || null;
    try {
        await req.pool.execute(`
            UPDATE assets SET tag=?, serial_number=?, name=?, category=?, model=?, specs=?, location=?, status=?, remarks=?
            WHERE id=?
        `, [tag || null, serial_number || null, name || null, category || null, assetModel, specs || null, location || null, status || 'Available', remarks || null, id]);
        res.send({ message: 'Asset updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/assets', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM assets WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Assets deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// EMPLOYEES ROUTES
// -----------------

app.get('/api/employees', requireDb, async (req, res) => {
    try {
        const [rows] = await req.pool.query('SELECT * FROM employees');
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/employees', requireDb, async (req, res) => {
    const { id, empId, name, department, designation } = req.body;
    const employeeId = id || empId;
    try {
        await req.pool.execute(`
            INSERT INTO employees (id, name, department, designation)
            VALUES (?, ?, ?, ?)
        `, [employeeId, name, department, designation]);
        res.status(201).send({ message: 'Employee created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/employees/bulk', requireDb, async (req, res) => {
    const { employees } = req.body;
    if (!employees || !Array.isArray(employees)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        for (const emp of employees) {
            await req.pool.execute(`
                INSERT INTO employees (id, name, department, designation)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name), department=VALUES(department), designation=VALUES(designation)
            `, [emp.empId || emp.id, emp.name, emp.department || null, emp.designation || null]);
        }
        res.status(201).send({ message: 'Employees imported successfully' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/employees/:id', requireDb, async (req, res) => {
    const { id: paramId } = req.params;
    const { id, empId, name, department, designation } = req.body;
    const employeeId = id || empId || paramId;
    try {
        await req.pool.execute(`
            UPDATE employees SET id=?, name=?, department=?, designation=?
            WHERE id=?
        `, [employeeId, name, department, designation, paramId]);
        res.send({ message: 'Employee updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/employees', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM employees WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Employees deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// ASSIGNMENTS ROUTES
// -----------------

app.get('/api/assignments', requireDb, async (req, res) => {
    try {
        const [rows] = await req.pool.query(`
            SELECT a.*, asst.tag as assetTag, asst.model as model, emp.name as employee
            FROM assignments a
            JOIN assets asst ON a.asset_id = asst.id
            JOIN employees emp ON a.employee_id = emp.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/assignments', requireDb, async (req, res) => {
    const { assetTag, employee, status, date } = req.body;
    try {
        const [assets] = await req.pool.query('SELECT id FROM assets WHERE tag = ?', [assetTag]);
        if (assets.length === 0) return res.status(404).send({ message: 'Asset not found' });
        
        const [employees] = await req.pool.query('SELECT id FROM employees WHERE name = ?', [employee]);
        if (employees.length === 0) return res.status(404).send({ message: 'Employee not found' });

        const [activeAssigns] = await req.pool.query('SELECT id FROM assignments WHERE asset_id = ? AND status = ?', [assets[0].id, 'Active']);
        if (activeAssigns.length > 0) return res.status(400).send({ message: 'Asset is already assigned' });

        const assignDate = date || new Date().toISOString().split('T')[0];
        const assignStatus = status || 'Active';

        await req.pool.execute(`
            INSERT INTO assignments (asset_id, employee_id, assignedBy, date, status)
            VALUES (?, ?, ?, ?, ?)
        `, [assets[0].id, employees[0].id, 'System', assignDate, assignStatus]);
        
        await req.pool.execute('UPDATE assets SET status = ? WHERE id = ?', ['Assigned', assets[0].id]);
        
        res.status(201).send({ message: 'Assignment created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/assignments/:id', requireDb, async (req, res) => {
    const { id } = req.params;
    const { assetTag, employee, status, date } = req.body;
    try {
        const [assets] = await req.pool.query('SELECT id FROM assets WHERE tag = ?', [assetTag]);
        if (assets.length === 0) return res.status(404).send({ message: 'Asset not found' });
        
        const [employees] = await req.pool.query('SELECT id FROM employees WHERE name = ?', [employee]);
        if (employees.length === 0) return res.status(404).send({ message: 'Employee not found' });

        await req.pool.execute(`
            UPDATE assignments SET asset_id=?, employee_id=?, date=?, status=?
            WHERE id=?
        `, [assets[0].id, employees[0].id, date || new Date().toISOString().split('T')[0], status || 'Active', id]);
        res.send({ message: 'Assignment updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/assignments', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM assignments WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Assignments deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// -----------------
// TRANSFERS & RETURNS ROUTES
// -----------------

app.get('/api/transfers', requireDb, async (req, res) => {
    try {
        const [rows] = await req.pool.query('SELECT * FROM transfers');
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/api/returns', requireDb, async (req, res) => {
    try {
        const [rows] = await req.pool.query('SELECT * FROM `returns`');
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/transfers', requireDb, async (req, res) => {
    const { assetTag, assetName, model, brand, fromEmployee, toEmployee, transferPath, date, status } = req.body;
    const transferModel = model || brand || null;
    try {
        await req.pool.execute(`
            INSERT INTO transfers (assetTag, assetName, model, fromEmployee, toEmployee, transferPath, date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [assetTag, assetName, transferModel, fromEmployee, toEmployee, transferPath, date || new Date().toISOString().split('T')[0], status || 'Completed']);
        
        await req.pool.execute(`
            UPDATE assignments a
            JOIN assets asst ON a.asset_id = asst.id
            JOIN employees emp ON emp.name = ?
            SET a.employee_id = emp.id
            WHERE asst.tag = ? AND a.status = 'Active'
        `, [toEmployee, assetTag]);

        res.status(201).send({ message: 'Transfer created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/transfers/:id', requireDb, async (req, res) => {
    const { id } = req.params;
    const { assetTag, assetName, model, brand, fromEmployee, toEmployee, transferPath, date, status } = req.body;
    const transferModel = model || brand || null;
    try {
        await req.pool.execute(`
            UPDATE transfers SET assetTag=?, assetName=?, model=?, fromEmployee=?, toEmployee=?, transferPath=?, date=?, status=?
            WHERE id=?
        `, [assetTag, assetName, transferModel, fromEmployee, toEmployee, transferPath, date, status, id]);
        res.send({ message: 'Transfer updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/transfers', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM transfers WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Transfers deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/returns', requireDb, async (req, res) => {
    const { assetTag, assetName, model, brand, employee, empName, condition, date, remarks, status } = req.body;
    const returnedBy = employee || empName;
    const returnModel = model || brand || null;
    try {
        await req.pool.execute(`
            INSERT INTO \`returns\` (assetTag, assetName, model, empName, date, \`condition\`, status, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [assetTag, assetName, returnModel, returnedBy, date || new Date().toISOString().split('T')[0], condition || 'Working', status || 'Completed', remarks]);
        
        await req.pool.execute('UPDATE assets SET status = ? WHERE tag = ?', ['Available', assetTag]);
        
        await req.pool.execute(`
            UPDATE assignments a
            JOIN assets asst ON a.asset_id = asst.id
            SET a.status = 'Returned'
            WHERE asst.tag = ? AND a.status = 'Active'
        `, [assetTag]);

        res.status(201).send({ message: 'Return created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/returns/:id', requireDb, async (req, res) => {
    const { id } = req.params;
    const { assetTag, assetName, model, brand, employee, empName, condition, date, remarks, status } = req.body;
    const returnedBy = employee || empName;
    const returnModel = model || brand || null;
    try {
        await req.pool.execute(`
            UPDATE \`returns\` SET assetTag=?, assetName=?, model=?, empName=?, date=?, \`condition\`=?, status=?, remarks=?
            WHERE id=?
        `, [assetTag, assetName, returnModel, returnedBy, date, condition, status, remarks, id]);
        res.send({ message: 'Return updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/returns', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM \`returns\` WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Returns deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// USERS ENDPOINTS
app.get('/api/users', requireDb, async (req, res) => {
    try {
        const [rows] = await req.pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.post('/api/users', requireDb, async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
        await req.pool.execute(
            'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
            [username, password, name, role]
        );
        res.status(201).send({ message: 'User created' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.put('/api/users/:id', requireDb, async (req, res) => {
    const { id } = req.params;
    const { username, password, name, role } = req.body;
    try {
        if (password) {
            await req.pool.execute(
                'UPDATE users SET username=?, password=?, name=?, role=? WHERE id=?',
                [username, password, name, role, id]
            );
        } else {
            await req.pool.execute(
                'UPDATE users SET username=?, name=?, role=? WHERE id=?',
                [username, name, role, id]
            );
        }
        res.send({ message: 'User updated' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.delete('/api/users', requireDb, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).send({ message: 'Invalid payload' });
    try {
        const placeholders = ids.map(() => '?').join(',');
        await req.pool.query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
        res.send({ message: 'Users deleted' });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
