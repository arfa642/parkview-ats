require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        // Connect without database first to create it if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_SERVER || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        const dbName = process.env.DB_DATABASE || 'pv_ats_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' created or already exists.`);

        await connection.query(`USE \`${dbName}\`;`);

        // Create Assets Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS assets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tag VARCHAR(255),
                serial_number VARCHAR(255),
                name VARCHAR(255),
                category VARCHAR(255),
                model VARCHAR(255),
                specs TEXT,
                location VARCHAR(255),
                status VARCHAR(100) DEFAULT 'Available',
                remarks TEXT
            )
        `);
        console.log("Assets table created.");

        // Create Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255),
                department VARCHAR(255),
                designation VARCHAR(255)
            )
        `);
        console.log("Employees table created.");

        // Create Assignments Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_id INT,
                employee_id VARCHAR(255),
                assignedBy VARCHAR(255),
                date DATE,
                status VARCHAR(100)
            )
        `);
        console.log("Assignments table created.");

        // Create Transfers Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transfers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                assetTag VARCHAR(255),
                assetName VARCHAR(255),
                model VARCHAR(255),
                fromEmployee VARCHAR(255),
                toEmployee VARCHAR(255),
                transferPath VARCHAR(500),
                date DATE,
                status VARCHAR(100)
            )
        `);
        console.log("Transfers table created.");

        // Create Returns Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`returns\` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                assetTag VARCHAR(255),
                assetName VARCHAR(255),
                model VARCHAR(255),
                empName VARCHAR(255),
                date DATE,
                \`condition\` VARCHAR(255),
                status VARCHAR(100),
                remarks TEXT
            )
        `);
        console.log("Returns table created.");

        // Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                name VARCHAR(255),
                role VARCHAR(100)
            )
        `);
        console.log("Users table created.");

        // Insert Default Users
        await connection.query(`
            INSERT IGNORE INTO users (id, username, password, name, role) VALUES 
            (1, 'developer', 'password123', 'Muhammad Arfa', 'Developer'),
            (2, 'hr', 'password123', 'Sarah Ahmed', 'HR'),
            (3, 'ceo', 'password123', 'Mr. Junaid Amin', 'CEO'),
            (4, 'executive', 'password123', 'Fahad Bashir', 'Executive')
        `);
        console.log("Default users inserted.");

        console.log("All tables set up successfully!");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Error setting up MySQL database:", error);
        process.exit(1);
    }
}

setupDatabase();
