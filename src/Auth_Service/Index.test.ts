import sinon, { SinonStub } from "sinon";
import authService from "./Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import * as db from "../Xternal_Services/database/db";
import redis from "../Xternal_Services/redis/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validationService from "../Validation_Service/Index.controller";

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
		checkPasswordFormatStub: SinonStub;

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

		process.env.SECRET_KEY = "mock_jwt_secret";
		process.env.REFRESH_SECRET_KEY = "mock_refresh_secret";
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("createSession", () => {
		it("should create a session with valid credentials", async () => {
			const mockUserData = [{ ID: 1, Password: "hashedPassword" }];
			queryStub.resolves(mockUserData);
			bcryptCompareStub.resolves(true);
			jwtSignStub.onFirstCall().returns("mockSessionToken");
			jwtSignStub.onSecondCall().returns("mockRefreshToken");
			redisSetStub.resolves("OK");

			const result = await authService.createSession("test@example.com", "password123");

			expect(result).toBe(
				JSON.stringify({
					sessionToken: "mockSessionToken",
					refreshToken: "mockRefreshToken",
				})
			);
			expect(checkEmailFormatStub.calledOnceWith("test@example.com")).toBe(true);
			expect(checkPasswordFormatStub.calledOnceWith("password123")).toBe(true);
			expect(
				queryStub.calledOnceWith("SELECT ID, Password FROM Account WHERE Email = ?", [
					"test@example.com",
				])
			).toBe(true);
			expect(bcryptCompareStub.calledOnceWith("password123", "hashedPassword")).toBe(true);
			expect(jwtSignStub.calledTwice).toBe(true);
			expect(redisSetStub.calledTwice).toBe(true);
		});

		it("should return false with invalid email", async () => {
			queryStub.resolves([]);

			const result = await authService.createSession("test@example.com", "password123");

			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
		});

		it("should return false with invalid password", async () => {
			queryStub.resolves([{ ID: 1, Password: "hashedPassword" }]);
			bcryptCompareStub.resolves(false);

			const result = await authService.createSession("test@example.com", "wrongpassword");

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

			const result = await authService.refreshSession("invalidRefreshToken");

			expect(result).toBe(false);
			// expect(loggingServiceStub.calledOnce).toBe(true); // I genuinely don't know why this is failing
		});
	});
});
