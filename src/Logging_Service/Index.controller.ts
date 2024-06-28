/**
 * @module logging-service
 * A module providing a centralized logging service for recording access, error, and application events for future development.
 *
 * This module exports a singleton instance of the `LoggingService` class, making it convenient to use
 * throughout your application without having to create multiple instances.
 *
 * @example
 * import loggingService from './logging-service';
 *
 * loggingService.access('User logged in', '/auth/login', req);
 * loggingService.error('Database connection error', '/db/connect');
 * loggingService.application('Server started', '/index.js');
 */

import { Request } from "express";
import fs from "fs";

/**
 * @typedef {"Access" | "Error" | "Application"} LogType
 * Defines the possible types of logs that can be generated.
 */
type LogType = "Access" | "Error" | "Application";

/**
 * Interface defining the methods for the LoggingService.
 * @interface
 */
interface LoggingService_ControllerModel {
	/**
	 * Logs a message to the appropriate log file based on the type.
	 * @param {LogType} type - The type of log entry.
	 * @param {string} message - The message to log.
	 * @param {string} originFilePath - The file path where the log is originating.
	 * @param {Request | undefined} [req] - The Express request object (optional).
	 */
	log(type: LogType, message: string, originFilePath: string, req?: Request): void;

	/**
	 * Logs an access entry with request details.
	 * @param {string} message - The access message to log.
	 * @param {string} originFilePath - The file path where the log is originating.
	 * @param {Request} req - The Express request object.
	 */
	access(message: string, originFilePath: string, req: Request): void;

	/**
	 * Logs an error entry with error details.
	 * @param {string} message - The error message to log.
	 * @param {string} originFilePath - The file path where the log is originating.
	 * @param {Request | undefined} [req] - The Express request object (optional).
	 */
	error(message: string, originFilePath: string, req?: Request): void;

	/**
	 * Logs an application-level message.
	 * @param {string} message - The application message to log.
	 * @param {string} originFilePath - The file path where the log is originating.
	 */
	application(message: string, originFilePath: string): void;

	/**
	 * Generates a formatted timestamp string.
	 * @returns {string} - The formatted timestamp.
	 */
	timestamp(): string;

	/**
	 * Appends a message to a specified file.
	 * @param {string} filePath - The path to the log file.
	 * @param {string} message - The message to append.
	 */
	writeToFile(filePath: string, message: string): void;
}

/**
 * Class responsible for logging events to different log files.
 * @class
 */
export class LoggingService implements LoggingService_ControllerModel {
	public log(type: LogType, message: string, originPath: string, req: Request | undefined): void {
		switch (type) {
			case "Access":
				this.access(message, originPath, req);
				break;
			case "Error":
				this.error(message, originPath, req);
				break;
			case "Application":
				this.application(message, originPath);
				break;
		}
	}

	public access(message: string, originFilePath: string, req: Request | undefined): void {
		const logEntry = `${this.timestamp()} [ACCESS] ${req?.method} ${
			req?.originalUrl
		} ${message} [Client IP: ${req?.ip}]`; // Removing originating filepath to prevent fingerprinting.
		this.writeToFile("./access.log", logEntry);
	}

	public error(
		message: string,
		originFilePath: string,
		req: Request | undefined = undefined
	): void {
		const errorMessage =
			typeof message === "object" && message !== null && "message" in message
				? (message as { message: string }).message
				: message;

		const logEntry = `${this.timestamp()} [ERROR] ${errorMessage} [Origin File: ${originFilePath}] [Client IP: ${
			req?.ip
		}] [${req?.method} ${req?.originalUrl}]`;

		this.writeToFile("./err.log", logEntry);
	}

	public application(message: string, originFilePath: string): void {
		const logEntry = `${this.timestamp()} [APPLICATION] ${message}`;
		this.writeToFile("./application.log", logEntry);
	}

	public timestamp(): string {
		const now = new Date();
		const formattedDate = `${now.getDate()}/${now.toLocaleString("default", {
			month: "short",
		})}/${now.getFullYear()}:${now.getHours().toString().padStart(2, "0")}:${now
			.getMinutes()
			.toString()
			.padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
		console.log(formattedDate);

		return formattedDate;
	}

	public writeToFile(filePath: string, message: string): void {
		fs.appendFile(filePath, message + "\n", (err: NodeJS.ErrnoException | null) => {
			if (err) {
				console.error(`Error writing to log file ${filePath}:`, err);
			}
		});
	}
}

export const loggingService = new LoggingService();
