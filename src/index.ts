import { Request, Response } from "express";
import { query } from "./Xternal_Services/database/db";
import emailService from "./Email_Service/Index.controller";
import productService from "./Product_Service/Index.controller";
const express = require("express");
const app = express();

app.get("/", async (req: Request, res: Response) => {
	const deleteSuccess = await productService.deleteProduct(2);
	if (!deleteSuccess) {
		console.error("Failed to delete product.");
		return res.status(500).send("Error deleting product");
	}

	res.send("Hello World!");
});

app.listen(3000, () => {
	console.log("Server is running on port 3000");
});
