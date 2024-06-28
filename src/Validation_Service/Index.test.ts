import { createHmac } from "crypto";
import dotenv from "dotenv";
import validationService from "./Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";

dotenv.config();

describe("ValidationService", () => {
	describe("checkEmailFormat", () => {
		it("should return true for a valid email format", () => {
			const validEmail = "test@example.com";
			const result = validationService.checkEmailFormat(validEmail);
			expect(result).toBe(true);
		});

		it("should return false for an invalid email format", () => {
			const invalidEmail = "invalid-email";
			const result = validationService.checkEmailFormat(invalidEmail);
			expect(result).toBe(false);
		});
	});

	describe("checkPasswordFormat", () => {
		it("should return true for a valid password format", () => {
			const validPassword = "Password123!";
			const result = validationService.checkPasswordFormat(validPassword);
			expect(result).toBe(true);
		});

		it("should return false for an invalid password format", () => {
			const invalidPassword = "weakpassword";
			const result = validationService.checkPasswordFormat(invalidPassword);
			expect(result).toBe(false);
		});
	});

	describe("checkNameFormat", () => {
		it("should return true for a valid name format", () => {
			const validName = "John Doe";
			const result = validationService.checkNameFormat(validName);
			expect(result).toBe(true);
		});

		it("should return false for an invalid name format", () => {
			const invalidName = "1234";
			const result = validationService.checkNameFormat(invalidName);
			expect(result).toBe(false);
		});
	});

	describe("checkSexFormat", () => {
		it("should return true for valid sex values", () => {
			const validSex1 = "M";
			const validSex2 = "F";
			const validSex3 = "O";
			const result1 = validationService.checkSexFormat(validSex1);
			const result2 = validationService.checkSexFormat(validSex2);
			const result3 = validationService.checkSexFormat(validSex3);
			expect(result1).toBe(true);
			expect(result2).toBe(true);
			expect(result3).toBe(true);
		});

		it("should return false for an invalid sex value", () => {
			const invalidSex = "X";
			const result = validationService.checkSexFormat(invalidSex);
			expect(result).toBe(false);
		});
	});

	describe("checkPriceFormat", () => {
		it("should return true for a valid price format", () => {
			const validPrice = 19.99;
			const result = validationService.checkPriceFormat(validPrice);
			expect(result).toBe(true);
		});

		it("should return false for an invalid price format", () => {
			const invalidPrice = -10;
			const result = validationService.checkPriceFormat(invalidPrice);
			expect(result).toBe(false);
		});
	});

	describe("checkStockFormat", () => {
		it("should return true for a valid stock format", () => {
			const validStock = 100;
			const result = validationService.checkStockFormat(validStock);
			expect(result).toBe(true);
		});

		it("should return false for an invalid stock format", () => {
			const invalidStock = "not a number";
			const result = validationService.checkStockFormat(invalidStock as any);
			expect(result).toBe(false);
		});

		it("should return false for a negative stock value", () => {
			const negativeStock = -10;
			const result = validationService.checkStockFormat(negativeStock);
			expect(result).toBe(false);
		});

		it("should return false for a floating point value", () => {
			const negativeStock = 1.15;
			const result = validationService.checkStockFormat(negativeStock);
			expect(result).toBe(false);
		});
	});

	describe("checkAPIKeyFormat", () => {
		it("should return true for a valid API key format", () => {
			const validAPIKey = "123e4567-e89b-12d3-a456-426614174000";
			const result = validationService.checkAPIKeyFormat(validAPIKey);
			expect(result).toBe(true);
		});

		it("should return false for an invalid API key format", () => {
			const invalidAPIKey = "invalid-api-key";
			const result = validationService.checkAPIKeyFormat(invalidAPIKey);
			expect(result).toBe(false);
		});
	});

	describe("checkRefreshTokenFormat", () => {
		it("should return true for a valid refresh token format", () => {
			const validRefreshToken = "123e4567-e89b-12d3-a456-426614174000";
			const result = validationService.checkRefreshTokenFormat(validRefreshToken);
			expect(result).toBe(true);
		});

		it("should return false for an invalid refresh token format", () => {
			const invalidRefreshToken = "invalid-refresh-token";
			const result = validationService.checkRefreshTokenFormat(invalidRefreshToken);
			expect(result).toBe(false);
		});
	});

	describe("checkTokenSignature", () => {
		beforeAll(() => {
			process.env.API_Secret = "API-Secret";
		});

		afterAll(() => {
			delete process.env.API_Secret;
		});

		it("should return true for a valid token signature", () => {
			const validToken =
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
			const result = validationService.checkTokenSignature(validToken);
			expect(result).toBe(true);
		});

		it("should return false for an invalid token signature", () => {
			const invalidToken = "invalid.token.payload.invalidsignature";
			const result = validationService.checkTokenSignature(invalidToken);
			expect(result).toBe(false);
		});
	});
});
