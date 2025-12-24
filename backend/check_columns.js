
import { sequelize } from './DB/DBconnection.js';

async function check() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("PRAGMA table_info(users);");
        console.log("Columns:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
