import { promisify } from "util";
import { loggingService } from "../Logging_Service/Index.controller";
import validationService from "../Validation_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";
import redis from "../Xternal_Services/redis/db";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

interface AuthService_ControllerModel {
	createSession(email: string, password: string): Promise<string | boolean>;
	verifySession(sessionToken: string): Promise<boolean>;
	deleteSession(sessionToken: string): Promise<boolean>;
	refreshSession(refreshToken: string): Promise<string | boolean>;
}

class AuthService implements AuthService_ControllerModel {
	public async createSession(email: string, password: string): Promise<string | boolean> {
		if (
			!validationService.checkEmailFormat(email) ||
			!validationService.checkPasswordFormat(password)
		) {
			throw new Error("Invalid email or password format");
		}

		try {
			const user = await query<{ ID: number; Password: string }>(
				"SELECT ID, Password FROM Account WHERE Email = ?",
				[email]
			);
			if (user.length === 0) {
				throw new Error("Bad credentials");
			}

			const account = user[0];
			const passwordMatch = await bcrypt.compare(password, account.Password);
			if (!passwordMatch) {
				throw new Error("Bad credentials");
			}

			const sessionToken = jwt.sign({ userId: account.ID }, process.env.SECRET_KEY, {
				expiresIn: "15m",
			});
			const refreshToken = jwt.sign({ userId: account.ID }, process.env.REFRESH_SECRET_KEY, {
				expiresIn: "7d",
			});

			await redis.set(`user_session:${sessionToken}`, JSON.stringify({ userId: account.ID }));
			await redis.set(
				`user_refresh:${refreshToken}`,
				JSON.stringify({ userId: account.ID }),
				{
					EX: 7 * 24 * 60 * 60,
				}
			);

			loggingService.application(
				"Session and refresh token created successfully",
				__filename
			);
			return JSON.stringify({ sessionToken, refreshToken });
		} catch (error) {
			loggingService.error(`Error creating session: ${error}`, __filename);
			return false;
		}
	}

	public async verifySession(sessionToken: string): Promise<boolean> {
		try {
			if (!validationService.checkTokenSignature(sessionToken)) {
				throw new Error("Invalid token signature");
			}

			const sessionData = await redis.get(`user_session:${sessionToken}`);
			if (!sessionData) throw new Error("Session not found");

			const sessionObj = JSON.parse(sessionData);
			loggingService.application("Session verified successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error verifying session: ${error}`, __filename);
			return false;
		}
	}

	public async deleteSession(sessionToken: string): Promise<boolean> {
		try {
			const deleted = await redis.del(`user_session:${sessionToken}`);
			if (!deleted) throw new Error("Session deletion failed");

			loggingService.application("Session deleted successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error deleting session: ${error}`, __filename);
			return false;
		}
	}

	public async refreshSession(refreshToken: string): Promise<string | boolean> {
		try {
			if (!validationService.checkRefreshTokenFormat(refreshToken)) {
				throw new Error("Invalid refresh token format");
			}

			const sessionData = await redis.get(`user_refresh:${refreshToken}`);
			if (!sessionData) throw new Error("Refresh token not found");

			const sessionObj = JSON.parse(sessionData);

			const newSessionToken = jwt.sign(
				{ userId: sessionObj.userId },
				process.env.SECRET_KEY,
				{
					expiresIn: "15m",
				}
			);

			await redis.set(`user_session:${newSessionToken}`, sessionData);
			await redis.del(`user_refresh:${refreshToken}`);

			loggingService.application("Session refreshed successfully", __filename);
			return newSessionToken;
		} catch (error) {
			loggingService.error(`Error refreshing session: ${error}`, __filename);
			return false;
		}
	}
}

const authService = new AuthService();
export default authService;
