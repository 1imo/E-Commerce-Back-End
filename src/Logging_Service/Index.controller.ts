import { Request } from "express";
import fs from "fs";

type log = "Access" | "Error" | "Application";

interface LoggingService_ControllerModel {
	log(type: log, message: string, filePath: string, req: Request | undefined): void;
	access(message: string, filePath: string, req: Request | undefined): void;
	error(message: string, filePath: string, req: Request | undefined): void;
	application(message: string, filePath: string, req: Request | undefined): void;
	timestamp(): string;
	writeToFile(filePath: string, message: string): void;
}

export class LoggingService implements LoggingService_ControllerModel {
	public log(type: log, message: string, originPath: string, req: Request | undefined): void {
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
		} ${message} [Client IP: ${req?.ip}] [Origin File: ${originFilePath}]`;
		this.writeToFile("./access.log", logEntry);
	}

	public error(message: string, originFilePath: string, req: Request | undefined): void {
		const logEntry = `${this.timestamp()} [ERROR] ${message} [Origin File: ${originFilePath}] [Client IP: ${
			req?.ip
		}] [${req?.method} ${req?.originalUrl}]`;
		this.writeToFile("./err.log", logEntry);
	}

	public application(message: string, originFilePath: string): void {
		const logEntry = `${this.timestamp()} [APPLICATION] ${message} [Origin File: ${originFilePath}]`;
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
