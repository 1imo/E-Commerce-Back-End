import sinon, { SinonStub } from "sinon";
import authService from "./Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import * as db from "../Xternal_Services/database/db";
import redis from "../Xternal_Services/redis/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validationService from "../Validation_Service/Index.controller";
import { createHmac } from "crypto";

jest.mock("../Xternal_Services/database/db");
jest.mock("../Xternal_Services/redis/db", () => ({
	set: jest.fn(),
	get: jest.fn(),
	del: jest.fn(),
}));
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthService", () => {
	let queryStub: SinonStub,
		redisSetStub: SinonStub,
		redisGetStub: SinonStub,
		redisDelStub: SinonStub,
		bcryptCompareStub: SinonStub,
		jwtSignStub: SinonStub,
		jwtVerifyStub: SinonStub,
		loggingServiceStub: SinonStub,
		checkEmailFormatStub: SinonStub,
		checkPasswordFormatStub: SinonStub,
		SECRET_KEY: string,
		REFRESH_SECRET_KEY: string,
		MAGIC_SIGNIN_KEY: string;

	beforeAll(() => {
		if (!process.env.MAGIC_SIGNIN_KEY) {
			process.env.MAGIC_SIGNIN_KEY = "VerySecretMagicKey";
		}
	});

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
		redisSetStub = sinon.stub(redis, "set");
		redisGetStub = sinon.stub(redis, "get");
		redisDelStub = sinon.stub(redis, "del");
		bcryptCompareStub = sinon.stub(bcrypt, "compare");
		jwtSignStub = sinon.stub(jwt, "sign");
		jwtVerifyStub = sinon.stub(jwt, "verify");
		loggingServiceStub = sinon.stub(loggingService, "error");
		checkEmailFormatStub = sinon.stub(validationService, "checkEmailFormat").returns(true);
		checkPasswordFormatStub = sinon
			.stub(validationService, "checkPasswordFormat")
			.returns(true);

		SECRET_KEY = process.env.SECRET_KEY || "";
		REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY || "";
		MAGIC_SIGNIN_KEY = process.env.MAGIC_SIGNIN_KEY || "";
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("login", () => {
		it("should log in with valid credentials", async () => {
			const mockUserData = [{ ID: 1, Password: "hashed_password" }];
			queryStub.resolves(mockUserData);
			bcryptCompareStub.resolves(true);
			jwtSignStub.returns("mock_session_token");

			const result = await authService.login("user@example.com", "password123");
			expect(result).toBe(
				JSON.stringify({
					sessionToken: "mock_session_token",
					refreshToken: "mock_session_token",
				})
			);
		});

		it("should fail login with invalid credentials", async () => {
			queryStub.resolves([]);
			bcryptCompareStub.resolves(false);

			const result = await authService.login("user@example.com", "wrong_password");
			expect(result).toBe(false);
		});
	});

	describe("createSession", () => {
		it("should create a session with valid credentials", async () => {
			const mockUserData = [{ ID: 1 }];
			queryStub.resolves(mockUserData);
			jwtSignStub.onFirstCall().returns("mockSessionToken");
			jwtSignStub.onSecondCall().returns("mockRefreshToken");
			redisSetStub.resolves("OK");

			const result = await authService.createSession("test@example.com");

			expect(result).toBe(
				JSON.stringify({
					sessionToken: "mockSessionToken",
					refreshToken: "mockRefreshToken",
				})
			);
			expect(checkEmailFormatStub.calledOnceWith("test@example.com")).toBe(true);
			expect(
				queryStub.calledOnceWith("SELECT ID FROM Account WHERE Email = ?", [
					"test@example.com",
				])
			).toBe(true);
			expect(jwtSignStub.calledTwice).toBe(true);
			expect(redisSetStub.calledTwice).toBe(true);
		});

		it("should return false with invalid email", async () => {
			queryStub.resolves([]);

			const result = await authService.createSession("test@example.com");

			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
		});
	});

	describe("verifySession", () => {
		it("should return true for a valid session", async () => {
			redisGetStub.resolves(JSON.stringify({ userId: 1 }));
			sinon.stub(validationService, "checkTokenSignature").returns(true);

			const result = await authService.verifySession("validSessionToken");

			expect(result).toBe(true);
			expect(redisGetStub.calledOnceWith("user_session:validSessionToken")).toBe(true);
		});

		it("should return false for an invalid or expired session", async () => {
			redisGetStub.resolves(null);
			const result = await authService.verifySession("invalidSessionToken");
			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
		});
	});

	describe("deleteSession", () => {
		it("should delete a session successfully", async () => {
			redisDelStub.resolves(true);

			const result = await authService.deleteSession("validSessionToken");

			expect(result).toBe(true);
			expect(redisDelStub.calledOnceWith("user_session:validSessionToken")).toBe(true);
		});

		it("should return false if session deletion fails", async () => {
			redisDelStub.resolves(false);

			const result = await authService.deleteSession("invalidSessionToken");

			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
		});
	});

	describe("refreshSession", () => {
		it("should refresh a session successfully", async () => {
			redisGetStub.resolves(JSON.stringify({ userId: 1 }));
			jwtSignStub.returns("newSessionToken");
			redisSetStub.resolves("OK");
			redisDelStub.resolves(1);
			sinon.stub(validationService, "checkRefreshTokenFormat").returns(true);

			const result = await authService.refreshSession("mockRefreshToken");

			expect(result).toBe("newSessionToken");
			expect(redisGetStub.calledOnceWith("user_refresh:mockRefreshToken")).toBe(true);
			expect(jwtSignStub.calledOnce).toBe(true);
			expect(redisSetStub.calledOnce).toBe(true);
			expect(redisDelStub.calledOnce).toBe(true);
		});

		it("should return false for an invalid refresh token", async () => {
			redisGetStub.resolves(null);
			sinon.stub(validationService, "checkRefreshTokenFormat").returns(false);

			const result = await authService.refreshSession("invalidRefreshToken");

			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
			expect(loggingServiceStub.firstCall.args[0]).toBe("Invalid refresh token format");
		});
	});

	describe("generateMagicToken", () => {
		it("should generate a valid magic token", () => {
			const email = "test@example.com";
			const issuedAt = 1719765669814;
			const expiresAt = issuedAt + 900000;
			const encodedEmail = Buffer.from(email).toString("base64");
			const data = `${encodedEmail}.${issuedAt}.${expiresAt}`;
			const hash = createHmac("sha256", MAGIC_SIGNIN_KEY).update(data).digest("hex");
			const expectedToken = `${data}.${hash}`;

			sinon.stub(Date, "now").returns(issuedAt);

			const result = authService.generateMagicToken(email);

			expect(result).toBe(expectedToken);

			(Date.now as sinon.SinonStub).restore();
		});

		it("should return an empty string if email is not provided", () => {
			const result = authService.generateMagicToken("");
			expect(result).toBe("");
		});
	});

	describe("verifyMagicToken", () => {
		it("should return the email if the token is valid", () => {
			const email = "user@example.com";
			const issuedAt = Date.now();
			const expiresAt = issuedAt + 900000; // 15 minutes in milliseconds
			const encodedEmail = Buffer.from(email).toString("base64");
			const data = `${encodedEmail}.${issuedAt}.${expiresAt}`;

			// Use the same MAGIC_SIGNIN_KEY as in the AuthService
			const testMagicSignInKey = "VerySecretMagicKey";
			process.env.MAGIC_SIGNIN_KEY = testMagicSignInKey;

			const hash = createHmac("sha256", testMagicSignInKey).update(data).digest("hex");
			const validToken = `${data}.${hash}`;

			const dateNowStub = sinon.stub(Date, "now").returns(issuedAt);

			console.log("Test MAGIC_SIGNIN_KEY:", testMagicSignInKey);
			console.log("Generated token:", validToken);

			const result = authService.verifyMagicToken(validToken);

			console.log("Verification result:", result);

			expect(result).toBe(email);

			dateNowStub.restore();
		});

		it("should return false for an invalid token", () => {
			const result = authService.verifyMagicToken("invalid.token");
			expect(result).toBe(false);
		});

		it("should return false for an empty token", () => {
			const result = authService.verifyMagicToken("");
			expect(result).toBe(false);
		});

		it("should return false for an expired token", () => {
			const email = "user@example.com";
			const issuedAt = Date.now() - 1000000;
			const expiresAt = issuedAt + 900000;
			const data = `${email}.${issuedAt}.${expiresAt}`;
			const hash = createHmac("sha256", MAGIC_SIGNIN_KEY).update(data).digest("hex");
			const expiredToken = `${data}.${hash}`;

			const result = authService.verifyMagicToken(expiredToken);

			expect(result).toBe(false);
		});
	});
});
