import { loggingService } from "../Logging_Service/Index.controller";
import validationService from "../Validation_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";
import redis from "../Xternal_Services/redis/db";
import { createHmac } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Authentication Service
 *
 * This module provides a service for managing user authentication, including session creation, verification, deletion, and refresh.
 * It interacts with the database for user credentials, Redis for session storage, and external services for logging and validation.
 *
 * @module AuthService
 */

/**
 * @interface AuthService_ControllerModel
 * Defines the interface for the AuthService controller, outlining methods for managing user authentication.
 */
interface AuthService_ControllerModel {
	/**
	 * Creates a new session for the user.
	 * @param {string} email - The email of the user.
	 * @returns {Promise<string | boolean>} A promise that resolves to a session token if successful, or false if unsuccessful.
	 */
	createSession(email: string): Promise<string | boolean>;

	/**
	 * Verifies the validity of a session token.
	 * @param {string} sessionToken - The session token to verify.
	 * @returns {Promise<boolean>} A promise that resolves to true if the session token is valid, or false if invalid.
	 */
	verifySession(sessionToken: string): Promise<boolean>;

	/**
	 * Deletes an existing session.
	 * @param {string} sessionToken - The session token to delete.
	 * @returns {Promise<boolean>} A promise that resolves to true if the session was successfully deleted, or false if unsuccessful.
	 */
	deleteSession(sessionToken: string): Promise<boolean>;

	/**
	 * Refreshes an existing session using a refresh token.
	 * @param {string} refreshToken - The refresh token to use for refreshing the session.
	 * @returns {Promise<string | boolean>} A promise that resolves to a new session token if successful, or false if unsuccessful.
	 */
	refreshSession(refreshToken: string): Promise<string | boolean>;

	/**
	 * Generates a magic link token for email-based authentication.
	 * @param {string} email - The email of the user.
	 * @returns {string} The generated magic link token.
	 */
	generateMagicToken(email: string): string;

	/**
	 * Verifies the validity of a magic link token.
	 * @param {string} token - The magic link token to verify.
	 * @returns {string | boolean} The email associated with the token if valid, or false if invalid.
	 */
	verifyMagicToken(token: string): string | boolean;

	/**
	 * Logs in a user with email and password.
	 * @param {string} email - The email of the user.
	 * @param {string} password - The password of the user.
	 * @returns {Promise<string | boolean>} A promise that resolves to a session token if successful, or false if unsuccessful.
	 */
	login(email: string, password: string): Promise<string | boolean>;
}

/**
 * Authentication Service Controller
 *
 * Implements the AuthService_ControllerModel interface and provides concrete implementations for authentication operations.
 *
 * @class
 * @implements AuthService_ControllerModel
 */
class AuthService implements AuthService_ControllerModel {
	private readonly SECRET_KEY: string;
	private readonly REFRESH_SECRET_KEY: string;
	private readonly MAGIC_SIGNIN_KEY: string;

	constructor() {
		this.SECRET_KEY = process.env.SECRET_KEY || "";
		this.REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY || "";
		this.MAGIC_SIGNIN_KEY = process.env.MAGIC_SIGNIN_KEY || "";

		if (!this.SECRET_KEY || !this.REFRESH_SECRET_KEY || !this.MAGIC_SIGNIN_KEY) {
			throw new Error("Secret keys are not defined in environment variables");
		}

		console.log("AuthService MAGIC_SIGNIN_KEY:", this.MAGIC_SIGNIN_KEY);
	}

	public async login(email: string, password: string): Promise<string | boolean> {
		try {
			if (
				!validationService.checkEmailFormat(email) ||
				!validationService.checkPasswordFormat(password)
			) {
				throw new Error("Invalid email or password format");
			}

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

			return this.createSession(email);
		} catch (error) {
			loggingService.error(`Error logging in: ${error}`, __filename);
			return false;
		}
	}

	public async createSession(email: string): Promise<string | boolean> {
		try {
			if (!validationService.checkEmailFormat(email)) throw new Error("Invalid email format");

			const account = await query<{ ID: number }>("SELECT ID FROM Account WHERE Email = ?", [
				email,
			]).then((res) => res[0]);

			const sessionToken = jwt.sign({ userId: account.ID }, this.SECRET_KEY, {
				expiresIn: "15m",
			});
			const refreshToken = jwt.sign({ userId: account.ID }, this.REFRESH_SECRET_KEY, {
				expiresIn: "7d",
			});

			await redis.set(`user_session:${sessionToken}`, JSON.stringify({ userId: account.ID }));
			await redis.set(
				`user_refresh:${refreshToken}`,
				JSON.stringify({ userId: account.ID }),
				{ EX: 7 * 24 * 60 * 60 }
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
				loggingService.error("Invalid refresh token format", __filename);
				return false;
			}

			const sessionData = await redis.get(`user_refresh:${refreshToken}`);

			if (!sessionData) {
				loggingService.error("Refresh token not found", __filename);
				return false;
			}

			const sessionObj = JSON.parse(sessionData);

			let decodedToken: any;
			try {
				decodedToken = jwt.verify(refreshToken, this.REFRESH_SECRET_KEY);
			} catch (err) {
				if (err instanceof Error) {
					loggingService.error(`Error verifying refresh token: ${err}`, __filename);
					return false;
				}
			}

			const newSessionToken = jwt.sign({ userId: sessionObj.userId }, this.SECRET_KEY, {
				expiresIn: "15m",
			});

			await redis.set(`user_session:${newSessionToken}`, sessionData);
			await redis.del(`user_refresh:${refreshToken}`);

			loggingService.application("Session refreshed successfully", __filename);
			return newSessionToken;
		} catch (err) {
			loggingService.error(`Error refreshing session: ${err}`, __filename);
			return false;
		}
	}

	public generateMagicToken(email: string): string {
		if (!email || !this.MAGIC_SIGNIN_KEY) return "";

		const encodedEmail = Buffer.from(email).toString("base64");
		const issuedAt = Date.now();
		const expiresAt = issuedAt + 900000;
		const data = `${encodedEmail}.${issuedAt}.${expiresAt}`;
		const hash = createHmac("sha256", this.MAGIC_SIGNIN_KEY).update(data).digest("hex");
		return `${data}.${hash}`;
	}

	public verifyMagicToken(token: string): string | boolean {
		console.log("Entering verifyMagicToken method");
		try {
			if (!token) {
				console.log("Token is empty or undefined");
				return false;
			}
			const parts = token.split(".");
			console.log("Token parts:", parts);
			if (parts.length !== 4) {
				console.log("Invalid token format: expected 4 parts, got", parts.length);
				return false;
			}

			const [encodedEmail, issuedAt, expiresAt, hash] = parts;
			const email = Buffer.from(encodedEmail, "base64").toString("utf-8");

			console.log("Verifying token:", token);
			console.log("MAGIC_SIGNIN_KEY:", this.MAGIC_SIGNIN_KEY);
			console.log("Email:", email);
			console.log("IssuedAt:", issuedAt);
			console.log("ExpiresAt:", expiresAt);
			console.log("Hash:", hash);
			console.log("Current time:", Date.now());

			if (Date.now() > parseInt(expiresAt, 10)) {
				console.log("Token expired");
				return false;
			}

			const data = `${encodedEmail}.${issuedAt}.${expiresAt}`;
			console.log("Data for hash computation:", data);
			const validHash = createHmac("sha256", this.MAGIC_SIGNIN_KEY)
				.update(data)
				.digest("hex");

			console.log("Computed hash:", validHash);
			console.log("Token hash:", hash);

			if (hash === validHash) {
				console.log("Token valid, returning email");
				return email;
			} else {
				console.log("Invalid hash");
				return false;
			}
		} catch (error) {
			console.error("Error in verifyMagicToken:", error);
			loggingService.error(`Error verifying magic token: ${error}`, __filename);
			return false;
		}
	}
}

const authService = new AuthService();
export default authService;
