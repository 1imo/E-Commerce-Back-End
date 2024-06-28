import emailService from "../Email_Service/Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";

/**
 * @module AccountService
 * A module providing functionality for managing user accounts in the system.
 *
 * This module exports a singleton instance of the `AccountService` class, which
 * offers methods for creating, updating, deleting, and verifying user accounts.
 */

/**
 * @interface AccountService_DataModel
 * Represents the data model for a user account.
 */
interface AccountService_DataModel {
	ID?: number;
	Email: string;
	Verified?: boolean;
	Password: string;
	FirstName: string;
	LastName: string;
	Sex: string;
	Role?: "ADMIN" | "USER";
}

/**
 * @interface AccountService_ControllerModel
 * Defines the interface for an Account Controller, outlining methods for managing user accounts.
 */
interface AccountService_ControllerModel {
	/**
	 * @function createAccount
	 * Creates a new user account in the system.
	 * @param {AccountService_DataModel} data - The account data to be inserted.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	createAccount(data: AccountService_DataModel): Promise<boolean>;

	/**
	 * @function updateAccountDetails
	 * Updates an existing user account in the system.
	 * @param {Partial<AccountService_DataModel>} data - The updated account data.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	updateAccountDetails(data: Partial<AccountService_DataModel>): Promise<boolean>;

	/**
	 * @function deleteAccount
	 * Deletes a user account from the system.
	 * @param {number} id - The ID of the account to be deleted.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	deleteAccount(id: number): Promise<boolean>;

	/**
	 * @function verifyAccount
	 * Verifies a user account in the system.
	 * @param {string} email - The email of the account to be verified.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	verifyAccount(email: string): Promise<boolean>;

	/**
	 * @function isVerified
	 * Checks if a user account is verified.
	 * @param {number} id - The ID of the account to check.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if verified, `false` otherwise.
	 */
	isVerified(id: number): Promise<boolean>;
}

/**
 * @class AccountService
 * Service Controller class for managing user account operations (creation, update, deletion, verification)
 * using database interactions.
 */
class AccountService implements AccountService_ControllerModel {
	public async createAccount(data: Partial<AccountService_DataModel>): Promise<boolean> {
		loggingService.application("Creating new account", __filename);

		if (!data.Email || !emailService.isValidEmailFormat(data.Email)) {
			loggingService.error("Invalid or missing email format", __filename);
			return false;
		}

		if (!data.Password) {
			// TODO - Password Validation from future Auth module
			loggingService.error("Password is required", __filename);
			return false;
		}

		if (!data.Sex || !["M", "F", "O"].includes(data.Sex)) {
			loggingService.error("Invalid value for Sex. Must be 'M', 'F', or 'O'", __filename);
			return false;
		}

		if (!data.FirstName || !data.LastName) {
			loggingService.error("Names are required", __filename);
			return false;
		}

		try {
			await query(
				"INSERT INTO Account (Email, Password, FirstName, LastName, Sex, Role) VALUES (?, ?, ?, ?, ?, ?)",
				[
					data.Email,
					data.Password,
					data.FirstName,
					data.LastName,
					data.Sex,
					data.Role ?? "USER",
				]
			);
			emailService.sendVerifyEmail(data.Email);
			loggingService.application("Account created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error creating account: ${error}`, __filename);
			return false;
		}
	}

	public async updateAccountDetails(data: Partial<AccountService_DataModel>): Promise<boolean> {
		loggingService.application("Updating account details", __filename);
		if (!data.ID) {
			loggingService.error("Account ID is required for update", __filename);
			return false;
		}

		try {
			const rows = await query<AccountService_DataModel>(
				"SELECT * FROM Account WHERE ID = ?",
				[data.ID]
			);
			const current: AccountService_DataModel = rows[0];

			const updatedData: AccountService_DataModel = {
				...current,
				...data,
			};

			await query(
				"UPDATE Account SET Email = ?, Verified = ?, Password = ?, FirstName = ?, LastName = ?, Sex = ?, Role = ? WHERE ID = ?",
				[
					updatedData.Email,
					updatedData.Verified,
					updatedData.Password,
					updatedData.FirstName,
					updatedData.LastName,
					updatedData.Sex,
					updatedData.Role,
					updatedData.ID,
				]
			);
			loggingService.application("Account updated successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error updating account: ${error}`, __filename);
			return false;
		}
	}

	public async deleteAccount(id: number): Promise<boolean> {
		loggingService.application("Deleting account", __filename);
		try {
			await query("DELETE FROM Account WHERE ID = ?", [id]);

			loggingService.application("Account deleted successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error deleting account: ${error}`, __filename);
			return false;
		}
	}

	public async verifyAccount(email: string): Promise<boolean> {
		loggingService.application("Verifying account", __filename);
		try {
			await query("UPDATE Account SET Verified = true WHERE Email = ?", [email]);
			loggingService.application("Account verified successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error verifying account: ${error}`, __filename);
			return false;
		}
	}

	public async isVerified(id: number): Promise<boolean> {
		loggingService.application("Checking if account is verified", __filename);
		try {
			const rows = await query<Pick<AccountService_DataModel, "Verified">>(
				"SELECT Verified FROM Account WHERE ID = ?",
				[id]
			);
			const account: Pick<AccountService_DataModel, "Verified"> = rows[0];
			if (!account?.Verified) throw new Error("Error verifying account");

			loggingService.application(
				"Account verification status checked successfully",
				__filename
			);
			return account.Verified;
		} catch (error) {
			loggingService.error(
				`Error checking account verification status: ${error}`,
				__filename
			);
			return false;
		}
	}
}

const accountService = new AccountService();
export default accountService;
