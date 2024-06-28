/**
 * Email Service
 *
 * This module provides a centralized service for managing all email communication throughout the platform.
 * It handles various types of emails, including verification, password resets, basket follow-ups, campaigns, and customer service messages.
 *
 * @module EmailService
 */

import { Transporter } from "nodemailer";
import * as nodemailer from "nodemailer";
import { loggingService } from "../Logging_Service/Index.controller";

/**
 * Model defining the contract for the EmailService controller.
 *
 * @interface ControllerModel
 */
interface ControllerModel {
	/**
	 * Sends a verification email to the specified email address.
	 * @param {string} email - The email address to send the verification email to.
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the email was sent successfully, `false` otherwise.
	 */
	sendVerifyEmail(email: string): Promise<boolean>;
	/**
	 * Sends a password reset email to the specified email address.
	 * @param {string} email - The email address to send the password reset email to.
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the email was sent successfully, `false` otherwise.
	 */
	sendPasswordReset(email: string): Promise<boolean>;
	/**
	 * Sends a basket follow-up email to the specified email address.
	 * @param {string} email - The email address to send the basket follow-up email to.
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the email was sent successfully, `false` otherwise.
	 */
	sendBasketFollowUp(email: string): Promise<boolean>;
	/**
	 * Sends a campaign email to the specified email address.
	 * @param {string} email - The email address to send the campaign email to.
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the email was sent successfully, `false` otherwise.
	 */
	sendCampaign(email: string): Promise<boolean>;
	/**
	 * Sends a customer service email to the specified email address.
	 * @param {string} email - The email address to send the customer service email to.
	 * @param {string} subject - The subject of the customer service email.
	 * @param {string | HTMLElement} body - The body of the customer service email (can be plain text or HTML).
	 * @returns {Promise<boolean>} - A promise that resolves to `true` if the email was sent successfully, `false` otherwise.
	 */
	sendCustomerServiceEmail(
		email: string,
		subject: string,
		body: string | HTMLElement
	): Promise<boolean>;
	/**
	 * Validates the format of the given email address.
	 * @param {string} email - The email address to validate.
	 * @returns {boolean} - Returns `true` if the email format is valid, `false` otherwise.
	 */
}

/**
 * Email Service Controller
 *
 * Implements the `ControllerModel` interface and provides concrete implementations for sending various types of emails.
 *
 * @class
 * @implements ControllerModel
 */
class EmailService implements ControllerModel {
	public transport: Transporter | undefined; // Testing purposes

	constructor() {
		this.initializeTransport();
	}

	public async initializeTransport() {
		this.transport = nodemailer.createTransport({
			host: "localhost",
			port: 25,
			secure: false,
			tls: {
				rejectUnauthorized: false,
			},
		});
	}

	private async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
		const mailOptions = {
			from: "test@mute.com",
			to: to,
			subject: subject,
			html: body,
		};

		try {
			await this.transport?.sendMail(mailOptions);
			loggingService.application(
				`Email sent successfully to ${to} with subject "${subject}"`,
				__filename
			);
			return true;
		} catch (error) {
			loggingService.error(`Failed to send email to ${to}: ${error}`, __filename, undefined);
			return false;
		}
	}

	async sendVerifyEmail(email: string): Promise<boolean> {
		return this.sendEmail(email, "Verify Your Email", "<h1>Please verify your email</h1>");
	}

	async sendPasswordReset(email: string): Promise<boolean> {
		return this.sendEmail(email, "Password Reset", "<h1>Reset your password</h1>");
	}

	async sendBasketFollowUp(email: string): Promise<boolean> {
		return this.sendEmail(email, "Your Basket", "<h1>Don't forget about your basket</h1>");
	}

	async sendCampaign(email: string): Promise<boolean> {
		return this.sendEmail(email, "New Campaign", "<h1>Check out our new campaign</h1>");
	}

	async sendCustomerServiceEmail(
		email: string,
		subject: string,
		body: string | HTMLElement
	): Promise<boolean> {
		return this.sendEmail(email, subject, body.toString());
	}
}

const emailService = new EmailService();
export default emailService;
