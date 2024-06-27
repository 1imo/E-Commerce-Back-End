import { Request, Response } from "express";
import { query } from "./Xternal_Services/database/db";
import emailService from "./Email_Service/Index.controller";
const express = require("express");
const app = express();

app.get("/", async (req: Request, res: Response) => {
	const result = await emailService.sendVerifyEmail("mute@localhost");
	console.log("Email sent successfully:", result);
	res.send("Hello World!");
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
