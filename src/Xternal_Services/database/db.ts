import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { loggingService } from "../../Logging_Service/Index.controller";

dotenv.config();

let pool: mysql.Pool | null = null;

try {
	pool = mysql.createPool({
		host: process.env.DATABASE_HOST,
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
	});
	loggingService.application("Connected to MySQL database successfully", __filename);
} catch (error: any) {
	loggingService.error("Failed to connect to MySQL database", __filename);
	loggingService.error(error, __filename);
}

export const query = async <T>(sql: string, params?: any[]): Promise<T[]> => {
	if (!pool) {
		loggingService.error("Database connection is not available", __filename);
		throw new Error("Database connection is not available");
	}

	try {
		const escapedParams = params ? params.map(mysql.escape) : [];
		const formattedSql = mysql.format(sql, escapedParams);
		const [rows] = await pool.query(formattedSql);
		return rows as T[];
	} catch (error) {
		throw error;
	}
};

export default pool;
