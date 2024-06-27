import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const pool = mysql.createPool({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME,
});

export const query = async <T>(sql: string, params?: any[]): Promise<T[]> => {
	try {
		const [rows] = await pool.execute(sql, params);
		return rows as T[];
	} catch (error) {
		throw error;
	}
};

export default pool;
