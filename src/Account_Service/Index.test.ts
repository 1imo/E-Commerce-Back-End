import sinon, { SinonStub } from "sinon";
import accountService from "./Index.controller";
import emailService from "../Email_Service/Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import validationService from "../Validation_Service/Index.controller";
import * as db from "../Xternal_Services/database/db";

describe("AccountService", () => {
	let queryStub: SinonStub;
	let emailServiceStub: SinonStub;
	let loggingServiceAppStub: SinonStub;
	let loggingServiceErrorStub: SinonStub;
	let checkEmailFormatStub: SinonStub;
	let checkPasswordFormatStub: SinonStub;
	let checkSexFormatStub: SinonStub;
	let checkNameFormatStub: SinonStub;

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
		emailServiceStub = sinon.stub(emailService, "sendVerifyEmail");
		loggingServiceAppStub = sinon.stub(loggingService, "application");
		loggingServiceErrorStub = sinon.stub(loggingService, "error");
		checkEmailFormatStub = sinon.stub(validationService, "checkEmailFormat");
		checkPasswordFormatStub = sinon.stub(validationService, "checkPasswordFormat");
		checkSexFormatStub = sinon.stub(validationService, "checkSexFormat");
		checkNameFormatStub = sinon.stub(validationService, "checkNameFormat");
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
				Role: "USER",
			};
			checkEmailFormatStub.returns(true);
			checkPasswordFormatStub.returns(true);
			checkSexFormatStub.returns(true);
			checkNameFormatStub.returns(true);
			queryStub.resolves({ insertId: 1 });
			emailServiceStub.resolves(true);

			const result = await accountService.createAccount(newAccount);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(emailServiceStub.calledOnceWith(newAccount.Email)).toBe(true);
			expect(loggingServiceErrorStub.notCalled).toBe(true);
		});

		it("should return false if email is invalid", async () => {
			const invalidAccount = {
				Email: "invalid-email",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
			};
			checkEmailFormatStub.returns(false);

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
			checkEmailFormatStub.returns(true);

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Password is required", sinon.match.string)
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
			checkEmailFormatStub.returns(true);
			checkPasswordFormatStub.returns(true);
			checkSexFormatStub.returns(false);

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
			checkEmailFormatStub.returns(true);
			checkPasswordFormatStub.returns(true);
			checkSexFormatStub.returns(true);

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("First name is required", sinon.match.string)
			).toBe(true);
		});

		it("should return false if last name is missing", async () => {
			const invalidAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				Sex: "M",
			};
			checkEmailFormatStub.returns(true);
			checkPasswordFormatStub.returns(true);
			checkSexFormatStub.returns(true);
			checkNameFormatStub.returns(true);

			const result = await accountService.createAccount(invalidAccount);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Last name is required", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const newAccount = {
				Email: "test@example.com",
				Password: "password123",
				FirstName: "John",
				LastName: "Doe",
				Sex: "M",
				Role: "USER",
			};
			checkEmailFormatStub.returns(true);
			checkPasswordFormatStub.returns(true);
			checkSexFormatStub.returns(true);
			checkNameFormatStub.returns(true);
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.createAccount(newAccount);

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
			checkEmailFormatStub.returns(true);
			checkNameFormatStub.returns(true);
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

		it("should return false if email is invalid", async () => {
			const invalidUpdate = {
				ID: 1,
				Email: "invalid-email",
			};
			checkEmailFormatStub.returns(false);

			const result = await accountService.updateAccountDetails(invalidUpdate);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(
				loggingServiceErrorStub.calledWith("Invalid or missing email", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const updatedAccount = {
				ID: 1,
				Email: "updated@example.com",
			};
			checkEmailFormatStub.returns(true);
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.updateAccountDetails(updatedAccount);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});
	});

	describe("deleteAccount", () => {
		it("should delete an existing account", async () => {
			const accountId = 1;
			queryStub.resolves({ affectedRows: 1 });

			const result = await accountService.deleteAccount(accountId);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(
				loggingServiceAppStub.calledWith("Account deleted successfully", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const accountId = 1;
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.deleteAccount(accountId);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});
	});

	describe("verifyAccount", () => {
		it("should verify an existing account", async () => {
			const email = "test@example.com";
			checkEmailFormatStub.returns(true);
			queryStub.resolves({ affectedRows: 1 });

			const result = await accountService.verifyAccount(email);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(
				loggingServiceAppStub.calledWith(
					"Account verified successfully",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false if email is invalid", async () => {
			const invalidEmail = "invalid-email";
			checkEmailFormatStub.returns(false);

			const result = await accountService.verifyAccount(invalidEmail);

			expect(result).toBe(false);
			expect(queryStub.notCalled).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});

		it("should handle database errors gracefully", async () => {
			const email = "test@example.com";
			checkEmailFormatStub.returns(true);
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.verifyAccount(email);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});
	});

	describe("isVerified", () => {
		it("should return true for a verified account", async () => {
			const accountId = 1;
			queryStub.resolves([{ Verified: true }]);

			const result = await accountService.isVerified(accountId);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(
				loggingServiceAppStub.calledWith(
					"Account verification status checked successfully",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should return false for an unverified account", async () => {
			const accountId = 1;
			queryStub.resolves([{ Verified: false }]);

			const result = await accountService.isVerified(accountId);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});

		it("should handle database errors gracefully", async () => {
			const accountId = 1;
			queryStub.rejects(new Error("Database error"));

			const result = await accountService.isVerified(accountId);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceErrorStub.calledWith(sinon.match.string, sinon.match.string)).toBe(
				true
			);
		});
	});
});
