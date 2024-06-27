import { Transporter } from "nodemailer";
import * as nodemailer from "nodemailer";

/**
 * Email Service
 *
 * This module provides a centralized service for managing all email communication throughout the platform.
 * It handles various types of emails, including verification, password resets, basket follow-ups, campaigns, and customer service messages.
 *
 * @module EmailService
 */

/**
 * Model defining the contract for the EmailService controller.
 *
 * @interface ControllerModel
 */
interface ControllerModel {
	sendVerifyEmail(email: string): Promise<boolean>;
	sendPasswordReset(email: string): Promise<boolean>;
	sendBasketFollowUp(email: string): Promise<boolean>;
	sendCampaign(email: string): Promise<boolean>;
	sendCustomerServiceEmail(
		email: string,
		subject: string,
		body: string | HTMLElement
	): Promise<boolean>;
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
			return true;
		} catch (error) {
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
