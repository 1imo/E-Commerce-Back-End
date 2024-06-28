const dotenv = require("dotenv");
import { createHmac } from "crypto";
import { loggingService } from "../Logging_Service/Index.controller";

dotenv.config();

/**
 * Interface defining the methods that a ValidationService class must implement.
 * @interface ValidationService_ControllerModel
 */
interface ValidationService_ControllerModel {
	/**
	 * Checks if the provided email address matches the format.
	 * @param {string} email - The email address to validate.
	 * @returns {boolean} True if the email format is valid, otherwise false.
	 */
	checkEmailFormat(email: string): boolean;

	/**
	 * Checks if the provided password matches the specified format criteria.
	 * @param {string} password - The password to validate.
	 * @returns {boolean} True if the password format is valid, otherwise false.
	 */
	checkPasswordFormat(password: string): boolean;

	/**
	 * Checks if the provided name matches the specified format criteria.
	 * @param {string} name - The name to validate.
	 * @returns {boolean} True if the name format is valid, otherwise false.
	 */
	checkNameFormat(name: string): boolean;

	/**
	 * Checks if the provided sex identifier is one of the allowed values ('M', 'F', 'O').
	 * @param {string} sex - The sex identifier to validate.
	 * @returns {boolean} True if the sex format is valid, otherwise false.
	 */
	checkSexFormat(sex: string): boolean;

	/**
	 * Checks if the provided price is a valid non-negative number.
	 * @param {number} price - The price to validate.
	 * @returns {boolean} True if the price format is valid, otherwise false.
	 */
	checkPriceFormat(price: number): boolean;

	/**
	 * Checks if the provided stock quantity is a valid non-negative integer.
	 * @param {number} stock - The stock quantity to validate.
	 * @returns {boolean} True if the stock format is valid, otherwise false.
	 */
	checkStockFormat(stock: number): boolean;

	/**
	 * Checks if the provided API key matches the expected format and criteria.
	 * @param {string} apiKey - The API key to validate.
	 * @returns {boolean} True if the API key format is valid, otherwise false.
	 */
	checkAPIKeyFormat(apiKey: string): boolean;

	/**
	 * Checks if the provided refresh token matches the expected format and criteria.
	 * @param {string} refreshToken - The refresh token to validate.
	 * @returns {boolean} True if the refresh token format is valid, otherwise false.
	 */
	checkRefreshTokenFormat(refreshToken: string): boolean;

	/**
	 * Checks if the provided token's signature is valid using the configured JWT secret.
	 * @param {string} token - The JWT token to validate.
	 * @returns {boolean} True if the token signature is valid, otherwise false.
	 */
	checkTokenSignature(token: string): boolean;
}

/**
 * Implementation of ValidationService class that validates various formats and criteria.
 * @class ValidationService
 * @implements {ValidationService_ControllerModel}
 */
class ValidationService implements ValidationService_ControllerModel {
	checkEmailFormat(email: string): boolean {
		if (!email) return false;
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	checkPasswordFormat(password: string): boolean {
		if (!password) return false;
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&* ])[\w!@#$%^& *]{8,}$/;
		return passwordRegex.test(password);
	}

	checkNameFormat(name: string): boolean {
		if (!name) return false;
		const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
		return nameRegex.test(name);
	}

	checkSexFormat(sex: string): boolean {
		if (!sex) return false;
		const allowed = ["M", "F", "O"];
		return allowed.includes(sex);
	}

	checkPriceFormat(price: number): boolean {
		if (price === undefined || price === null) return false;
		if (!Number.isFinite(price) || price < 0) return false;

		const priceString = price.toString();
		const decimalIndex = priceString.indexOf(".");
		if (decimalIndex === -1) return false;

		const decimals = priceString.substring(decimalIndex + 1);
		return decimals.length === 2 && /^\d+$/.test(decimals);
	}

	checkStockFormat(stock: number): boolean {
		if (stock === undefined || stock === null) return false;
		return Number.isInteger(stock) && stock >= 0;
	}

	checkAPIKeyFormat(apiKey: string): boolean {
		if (!apiKey) return false;
		loggingService.application("Validating API key format", __filename);
		try {
			if (apiKey.length !== 36) throw new Error("Invalid API key format");

			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(apiKey)) throw new Error("Invalid API key format");

			const buffer = Buffer.from(apiKey.replace(/-/g, ""), "hex");
			if (buffer.length !== 16) throw new Error("Invalid API key format");

			return true;
		} catch (error) {
			loggingService.error(`Error validating API key format: ${error}`, __filename);
			return false;
		}
	}

	checkRefreshTokenFormat(refreshToken: string): boolean {
		if (!refreshToken) return false;
		loggingService.application("Validating refresh token format", __filename);
		try {
			if (!this.checkAPIKeyFormat(refreshToken))
				throw new Error("Invalid refresh token format");
			if (!this.checkTokenSignature(refreshToken))
				throw new Error("Invalid refresh token signature");
			loggingService.application("Refresh token format is valid", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error validating refresh token format: ${error}`, __filename);
			return false;
		}
	}

	checkTokenSignature(token: string): boolean {
		if (!token) return false;
		loggingService.application("Validating token signature", __filename);
		try {
			if (!process.env.SECRET_KEY)
				throw new Error("JWT_SECRET is missing from environment variables!");

			const [tokenPayload, tokenSignature] = token.split(".");
			const expectedSignature = createHmac("sha256", process.env.SECRET_KEY)
				.update(tokenPayload)
				.digest("hex");
			loggingService.application(`Token signature: ${tokenSignature}`, __filename);
			return tokenSignature === expectedSignature;
		} catch (error) {
			loggingService.error(`Error validating token signature: ${error}`, __filename);
			return false;
		}
	}
}

const validationService = new ValidationService();
export default validationService;
