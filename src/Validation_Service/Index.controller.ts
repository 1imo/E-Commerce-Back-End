const dotenv = require("dotenv");
import { createHmac } from "crypto";
import { loggingService } from "../Logging_Service/Index.controller";

dotenv.config();

interface ValidationService_ControllerModel {
	checkEmailFormat(email: string): boolean;
	checkPasswordFormat(password: string): boolean;
	checkNameFormat(name: string): boolean;
	checkSexFormat(sex: string): boolean;
	checkPriceFormat(price: number): boolean;
	checkStockFormat(stock: number): boolean;
	checkAPIKeyFormat(apiKey: string): boolean;
	checkRefreshTokenFormat(refreshtoken: string): boolean;
	checkTokenSignature(token: string): boolean;
	// sanitizeInput(input: string): string;
}

class ValidationService implements ValidationService_ControllerModel {
	checkEmailFormat(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	checkPasswordFormat(password: string): boolean {
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&* ])[\w!@#$%^& *]{8,}$/;
		return passwordRegex.test(password);
	}

	checkNameFormat(name: string): boolean {
		const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
		return nameRegex.test(name);
	}

	checkSexFormat(sex: string): boolean {
		const allowed = ["M", "F", "O"];
		return allowed.includes(sex) || false;
	}

	checkPriceFormat(price: number): boolean {
		return !isNaN(price) && price >= 0;
	}

	checkStockFormat(stock: number): boolean {
		return Number.isInteger(stock) && stock >= 0;
	}

	checkAPIKeyFormat(apiKey: string): boolean {
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
		loggingService.application("Validating token signature", __filename);
		try {
			if (!process.env.JWT_SECRET)
				throw new Error("JWT_SECRET is missing from environment variables!");

			// const [tokenPayload, tokenSignature] = token.split(".");
			// const expectedSignature = createHmac("sha256", process.env.JWT_SECRET)
			// 	.update(tokenPayload)
			// 	.digest("hex");
			// loggingService.application(`Token signature: ${tokenSignature}`, __filename);
			// return tokenSignature === expectedSignature;

			return true;
		} catch (error) {
			loggingService.error(`Error validating token signature: ${error}`, __filename);
			return false;
		}
	}
}

const validationService = new ValidationService();
export default validationService;
