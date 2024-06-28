import { loggingService } from "../Logging_Service/Index.controller";
import validationService from "../Validation_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";
import redis from "../Xternal_Services/redis/db";
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Authentication Service
 *
 * This module provides a service for managing user authentication, including session creation, verification, deletion, and refresh.
 * It interacts with the database for user credentials, Redis for session storage, and external services for logging and validation.
 *
 * @module AuthService
 */

/**
 * Model defining the contract for the AuthService controller.
 *
 * @interface AuthService_ControllerModel
 */
interface AuthService_ControllerModel {
	/**
	 * Creates a new user session based on valid credentials.
	 * @param {string} email - The user's email address.
	 * @param {string} password - The user's password.
	 * @returns {Promise<string | boolean>} A Promise that resolves to a string containing the session and refresh tokens if successful, or false if authentication fails.
	 * @throws {Error} If email or password format is invalid.
	 */
	createSession(email: string, password: string): Promise<string | boolean>;

	/**
	 * Verifies the validity of a given session token.
	 * @param {string} sessionToken - The session token to verify.
	 * @returns {Promise<boolean>} A Promise that resolves to true if the session is valid, false otherwise.
	 * @throws {Error} If token signature is invalid or session is not found.
	 */
	verifySession(sessionToken: string): Promise<boolean>;

	/**
	 * Deletes a user session associated with the given token.
	 * @param {string} sessionToken - The session token to delete.
	 * @returns {Promise<boolean>} A Promise that resolves to true if the session is deleted successfully, false otherwise.
	 * @throws {Error} If session deletion fails.
	 */
	deleteSession(sessionToken: string): Promise<boolean>;

	/**
	 * Refreshes a user session based on a valid refresh token.
	 * @param {string} refreshToken - The refresh token to use for refreshing the session.
	 * @returns {Promise<string | boolean>} A Promise that resolves to a new session token if successful, or false if refresh fails.
	 * @throws {Error} If refresh token format is invalid or token is not found.
	 */
	refreshSession(refreshToken: string): Promise<string | boolean>;
}

/**
 * Authentication Service Controller
 *
 * Implements the `AuthService_ControllerModel` interface and provides concrete implementations for authentication operations.
 *
 * @class
 * @implements AuthService_ControllerModel
 */
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
