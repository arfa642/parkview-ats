require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixCategories() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_SERVER || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'pv_ats_db'
        });

        // Fetch all assets
        const [assets] = await connection.query('SELECT * FROM assets');

        for (const asset of assets) {
            let newCategory = asset.name;
            let newModel = asset.model;

            const lowerName = (asset.name || '').toLowerCase();
            const lowerModel = (asset.model || '').toLowerCase();
            const lowerBrand = (asset.category || '').toLowerCase(); // Note: 'category' column might hold brand if UI is using it

            // Logic to infer category
            if (lowerName.includes('laptop') || lowerName.includes('thinkpad') || lowerName.includes('macbook') || lowerModel.includes('thinkpad') || lowerModel.includes('macbook') || lowerModel.includes('latitude')) {
                newCategory = 'Laptop';
            } else if (lowerName === 'pc' || lowerName.includes('pc') || lowerName.includes('desktop') || lowerModel.includes('optiplex') || lowerModel.includes('pc')) {
                newCategory = 'PC';
            } else if (lowerName.includes('mobile') || lowerName.includes('phone') || lowerModel.includes('iphone') || lowerModel.includes('phone')) {
                newCategory = 'Mobile Phone';
            } else if (lowerName.includes('printer') || lowerModel.includes('printer') || lowerModel.includes('laserjet')) {
                newCategory = 'Printer';
            } else if (lowerName.includes('monitor') || lowerModel.includes('ultrasharp') || lowerModel.includes('monitor') || lowerName.includes('led')) {
                newCategory = 'Monitor';
            } else if (lowerName.includes('equipment') || lowerModel.includes('cisco') || lowerModel.includes('router') || lowerModel.includes('switch')) {
                newCategory = 'Equipment';
            } else if (lowerName.includes('misc')) {
                newCategory = 'Misc.';
            } else {
                newCategory = 'Equipment'; // default fallback
            }

            console.log(`Updating asset ${asset.tag}: Name '${asset.name}' -> Category '${newCategory}'`);

            await connection.query(
                'UPDATE assets SET name = ? WHERE id = ?',
                [newCategory, asset.id]
            );
        }

        // Also update assignments, transfers, returns where assetName is stored
        const [assignments] = await connection.query('SELECT * FROM assignments');
        for (const assign of assignments) {
            const [matchedAssets] = await connection.query('SELECT name FROM assets WHERE tag = ?', [assign.assetTag]);
            if (matchedAssets.length > 0) {
                // assignments table doesn't have assetName, wait, the schema says:
                // assignments: id, asset_id, employee_id, assignedBy, date, status (No assetName)
            }
        }

        const [transfers] = await connection.query('SELECT * FROM transfers');
        for (const tr of transfers) {
            const [matchedAssets] = await connection.query('SELECT name FROM assets WHERE tag = ?', [tr.assetTag]);
            if (matchedAssets.length > 0) {
                await connection.query('UPDATE transfers SET assetName = ? WHERE id = ?', [matchedAssets[0].name, tr.id]);
            }
        }

        const [returns] = await connection.query('SELECT * FROM `returns`');
        for (const rt of returns) {
            const [matchedAssets] = await connection.query('SELECT name FROM assets WHERE tag = ?', [rt.assetTag]);
            if (matchedAssets.length > 0) {
                await connection.query('UPDATE `returns` SET assetName = ? WHERE id = ?', [matchedAssets[0].name, rt.id]);
            }
        }

        console.log("Database categories successfully updated!");
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixCategories();
