import { Request } from "express";
import fs from "fs";
import sinon from "sinon";
import { loggingService } from "./Index.controller";

describe("LoggingService", () => {
	let writeFileStub: sinon.SinonStub;
	let timestampStub: sinon.SinonStub;

	beforeEach(() => {
		writeFileStub = sinon.stub(fs, "appendFile");
		timestampStub = sinon.stub(loggingService, "timestamp").returns("[TEST_TIMESTAMP]");
	});

	afterEach(() => {
		writeFileStub.restore();
		timestampStub.restore();
	});

	describe("access()", () => {
		it("should log access entries with correct format and file path", () => {
			const reqMock: Partial<Request> = {
				method: "GET",
				originalUrl: "/test",
				ip: "127.0.0.1",
			};
			loggingService.access("Test access message", "testfile.js", reqMock as Request);

			expect(writeFileStub.calledOnce).toBe(true);
			expect(writeFileStub.firstCall.args[0]).toMatch(/access\.log$/);
			expect(writeFileStub.firstCall.args[1]).toMatch(
				/^\[TEST_TIMESTAMP\] \[ACCESS\] GET \/test Test access message \[Client IP: 127\.0\.0\.1\]\n$/
			);
		});
	});

	describe("error()", () => {
		it("should log error entries with correct format and file path", () => {
			const reqMock: Partial<Request> = {
				method: "POST",
				originalUrl: "/login",
				ip: "192.168.0.100",
			};
			loggingService.error("Test error message", "testfile.js", reqMock as Request);

			expect(writeFileStub.calledOnce).toBe(true);
			expect(writeFileStub.firstCall.args[0]).toMatch(/err\.log$/);
			expect(writeFileStub.firstCall.args[1]).toMatch(
				/^\[TEST_TIMESTAMP\] \[ERROR\] Test error message \[Origin File: testfile\.js\] \[Client IP: 192\.168\.0\.100\] \[POST \/login\]\n$/
			);
		});

		it("should handle errors with stack traces", () => {
			const error = new Error("Test error with stack trace");
			loggingService.error(
				error.stack ?? "Error message (no stack trace)",
				"testfile.js",
				undefined
			);

			expect(writeFileStub.calledOnce).toBe(true);
			expect(writeFileStub.firstCall.args[0]).toMatch(/err\.log$/);
			expect(writeFileStub.firstCall.args[1]).toContain("Test error with stack trace");
		});
	});

	describe("application()", () => {
		it("should log application entries with correct format and file path", () => {
			loggingService.application("Test application message", "testfile.js");

			expect(writeFileStub.calledOnce).toBe(true);
			expect(writeFileStub.firstCall.args[0]).toMatch(/application\.log$/);
			expect(writeFileStub.firstCall.args[1]).toMatch(
				/^\[TEST_TIMESTAMP\] \[APPLICATION\] Test application message\n$/
			);
		});
	});

	describe("writeToFile()", () => {
		it("should handle file write errors", () => {
			const consoleErrorStub = sinon.stub(console, "error");
			writeFileStub.yields(new Error("Simulated write error"));

			loggingService.writeToFile("test.log", "Test message");
			expect(consoleErrorStub.calledOnce).toBe(true);
			expect(consoleErrorStub.firstCall.args[0]).toContain("Error writing to log file");
			consoleErrorStub.restore();
		});
	});
});
