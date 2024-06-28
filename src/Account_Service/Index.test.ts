import sinon, { SinonStub } from "sinon";
import accountService from "./Index.controller";
import emailService from "../Email_Service/Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import * as db from "../Xternal_Services/database/db";

describe("AccountService", () => {
	let queryStub: SinonStub;
	let emailServiceStub: SinonStub;
	let loggingServiceAppStub: SinonStub;
	let loggingServiceErrorStub: SinonStub;

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
		emailServiceStub = sinon.stub(emailService, "sendVerifyEmail");
		loggingServiceAppStub = sinon.stub(loggingService, "application");
		loggingServiceErrorStub = sinon.stub(loggingService, "error");
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("createAccount", () => {
		it("should create a new account with valid data", async () => {
			const newAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};
			queryStub.resolves({ affectedRows: 1 });
			emailServiceStub.resolves(true);

			const result = await accountService.createAccount(newAccount);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(emailServiceStub.calledOnceWith(newAccount.Email)).toBe(true);
			expect(
				loggingServiceAppStub.calledWith("Account created successfully", sinon.match.string)
			).toBe(true);
		});

		it("should return false if email is invalid", async () => {
			const invalidAccount = {
				Email: "invalid-email",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith(
					"Invalid or missing email format",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false if email is missing", async () => {
			const invalidAccount = {
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith(
					"Invalid or missing email format",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false if password is missing", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Password is required", sinon.match.string)
			).toBe(true);
		});

		it("should return false if sex is missing", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith(
					"Invalid value for Sex. Must be 'M', 'F', or 'O'",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false if sex is invalid", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "X",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith(
					"Invalid value for Sex. Must be 'M', 'F', or 'O'",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false if first name is missing", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				Password: "password123",
				LastName: "Doe",
				Sex: "M",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Names are required", sinon.match.string)
			).toBe(true);
		});

		it("should return false if last name is missing", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				Sex: "M",
			};

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Names are required", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const validAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.createAccount(validAccount);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});
	});

	describe("updateAccountDetails", () => {
		it("should update an existing account", async () => {
			const updatedAccount = {
				ID: 1,
				Email: "updated@example.com",
				FirstName: "Jane",
			};
			queryStub.onFirstCall().resolves([
				{
					ID: 1,
					Email: "old@example.com",
					FirstName: "John",
					LastName: "Doe",
					Sex: "M",
					Role: "USER",
				},
			]);
			queryStub.onSecondCall().resolves({ affectedRows: 1 });

			const result = await accountService.updateAccountDetails(updatedAccount);

			expect(result).toBe(true);
			expect(queryStub.calledTwice).toBe(true);
			expect(
				loggingServiceAppStub.calledWith("Account updated successfully", sinon.match.string)
			).toBe(true);
		});

		it("should return false if account ID is missing", async () => {
			const invalidUpdate = {
				Email: "test@example.com",
			};

			const result = await accountService.updateAccountDetails(invalidUpdate);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith(
					"Account ID is required for update",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("deleteAccount", () => {
		it("should delete an existing account", async () => {
			queryStub.resolves({ affectedRows: 1 });

			const result = await accountService.deleteAccount(1);

			expect(result).toBe(true);
			expect(queryStub.calledOnceWith("DELETE FROM Account WHERE ID = ?", [1])).toBe(true);
			expect(
				loggingServiceAppStub.calledWith("Account deleted successfully", sinon.match.string)
			).toBe(true);
		});

		it("should return false if an error occurs during deletion", async () => {
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.deleteAccount(1);

			expect(result).toBe(false);
			expect(
				loggingServiceErrorStub.calledWith(
					"Error deleting account: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("verifyAccount", () => {
		it("should verify an account", async () => {
			queryStub.resolves({ affectedRows: 1 });

			const result = await accountService.verifyAccount("test@example.com");

			expect(result).toBe(true);
			expect(
				queryStub.calledOnceWith("UPDATE Account SET Verified = true WHERE Email = ?", [
					"test@example.com",
				])
			).toBe(true);
			expect(
				loggingServiceAppStub.calledWith(
					"Account verified successfully",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("isVerified", () => {
		it("should return true for a verified account", async () => {
			queryStub.resolves([{ Verified: true }]);

			const result = await accountService.isVerified(1);

			expect(result).toBe(true);
			expect(queryStub.calledOnceWith("SELECT Verified FROM Account WHERE ID = ?", [1])).toBe(
				true
			);
		});

		it("should return false for an unverified account", async () => {
			queryStub.resolves([{ Verified: false }]);

			const result = await accountService.isVerified(1);

			expect(result).toBe(false);
		});

		it("should return false if an error occurs", async () => {
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.isVerified(1);

			expect(result).toBe(false);
			expect(
				loggingServiceErrorStub.calledWith(
					"Error checking account verification status: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});
});
