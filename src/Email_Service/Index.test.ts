import sinon from "sinon";
import emailService from "./Index.controller";

describe("EmailService", () => {
	let sendMailStub: sinon.SinonStub;

	beforeEach(() => {
		if (!emailService.transport) {
			throw new Error("Transport is not initialized");
		}

		sendMailStub = sinon
			.stub(emailService.transport, "sendMail")
			.resolves({ messageId: "mocked-message-id" });
	});

	afterEach(() => {
		sinon.restore();
	});

	it("should send a verification email", async () => {
		const result = await emailService.sendVerifyEmail("mute@localhost");
		expect(result).toBe(true);

		expect(sendMailStub.calledOnce).toBe(true);
		expect(sendMailStub.firstCall.args[0]).toMatchObject({
			from: "test@mute.com",
			to: "mute@localhost",
			subject: "Verify Your Email",
			html: "<h1>Please verify your email</h1>",
		});
	});

	it("should send a password reset email", async () => {
		const result = await emailService.sendPasswordReset("mute@localhost");
		expect(result).toBe(true);

		expect(sendMailStub.calledOnce).toBe(true);
		expect(sendMailStub.firstCall.args[0]).toMatchObject({
			from: "test@mute.com",
			to: "mute@localhost",
			subject: "Password Reset",
			html: "<h1>Reset your password</h1>",
		});
	});

	it("should send a basket follow-up email", async () => {
		const result = await emailService.sendBasketFollowUp("mute@localhost");
		expect(result).toBe(true);

		expect(sendMailStub.calledOnce).toBe(true);
		expect(sendMailStub.firstCall.args[0]).toMatchObject({
			from: "test@mute.com",
			to: "mute@localhost",
			subject: "Your Basket",
			html: "<h1>Don't forget about your basket</h1>",
		});
	});

	it("should send a campaign email", async () => {
		const result = await emailService.sendCampaign("mute@localhost");
		expect(result).toBe(true);

		expect(sendMailStub.calledOnce).toBe(true);
		expect(sendMailStub.firstCall.args[0]).toMatchObject({
			from: "test@mute.com",
			to: "mute@localhost",
			subject: "New Campaign",
			html: "<h1>Check out our new campaign</h1>",
		});
	});

	it("should send a customer service email", async () => {
		const result = await emailService.sendCustomerServiceEmail(
			"mute@localhost",
			"Help Needed",
			"<p>I have a question.</p>"
		);
		expect(result).toBe(true);

		expect(sendMailStub.calledOnce).toBe(true);
		expect(sendMailStub.firstCall.args[0]).toMatchObject({
			from: "test@mute.com",
			to: "mute@localhost",
			subject: "Help Needed",
			html: "<p>I have a question.</p>",
		});
	});

	it("should handle errors when sending emails", async () => {
		const expectedError = new Error("Failed to send email");
		sendMailStub.rejects(expectedError);

		const result = await emailService.sendVerifyEmail("mute@localhost");
		expect(result).toBe(false);
	});

	it("should return true for a valid email format", () => {
		const validEmails = [
			"test@example.com",
			"user.name@domain.com",
			"first.last@sub.domain.co.in",
			"12345@domain.com",
		];

		validEmails.forEach((email) => {
			const result = emailService.isValidEmailFormat(email);
			expect(result).toBe(true);
		});
	});

	it("should return false for invalid email formats", () => {
		const invalidEmails = [
			"invalidemail@",
			"invalid.com",
			"missing@atdotcom",
			"spaces @ domain.com",
			"@missingusername.com",
		];

		invalidEmails.forEach((email) => {
			const result = emailService.isValidEmailFormat(email);
			expect(result).toBe(false);
		});
	});
});
