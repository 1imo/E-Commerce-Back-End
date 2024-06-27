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

			const expectedLogEntry =
				"[TEST_TIMESTAMP] [ACCESS] GET /test Test access message [Client IP: 127.0.0.1] [Origin File: testfile.js]";
			expect(writeFileStub.calledOnceWith("./access.log", expectedLogEntry + "\n")).toBe(
				true
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

			const expectedLogEntry =
				"[TEST_TIMESTAMP] [ERROR] Test error message [Origin File: testfile.js] [Client IP: 192.168.0.100] [POST /login]";
			expect(writeFileStub.calledOnceWith("./err.log", expectedLogEntry + "\n")).toBe(true);
		});

		it("should handle errors with stack traces", () => {
			const error = new Error("Test error with stack trace");
			loggingService.error(
				error.stack ?? "Error message (no stack trace)",
				"testfile.js",
				undefined
			);

			expect(
				writeFileStub.calledOnceWith(
					"./err.log",
					sinon.match((value) =>
						value.includes(error.stack ?? "Error message (no stack trace)")
					)
				)
			).toBe(true);
		});
	});

	describe("application()", () => {
		it("should log application entries with correct format and file path", () => {
			loggingService.application("Test application message", "testfile.js");

			const expectedLogEntry =
				"[TEST_TIMESTAMP] [APPLICATION] Test application message [Origin File: testfile.js]";
			expect(writeFileStub.calledOnceWith("./application.log", expectedLogEntry + "\n")).toBe(
				true
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
