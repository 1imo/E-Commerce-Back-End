/**
 * @module ProductService
 * A module providing functionality for managing product data in the database.
 *
 * This module exports a singleton instance of the `ProductService` class, which
 * offers methods for creating, updating, deleting, and retrieving product
 * information. It also provides functionality to retrieve products frequently
 * purchased together with a given product.
 */

import { loggingService } from "../Logging_Service/Index.controller";
import validationService from "../Validation_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";

/**
 * @interface Product_DataModel
 * Represents the data model for a product.
 */
export interface Product_DataModel {
	ID?: number;
	Name: string;
	Description: string;
	Price: number;
	Stock: number;
	ParentID?: number;
	CategoryID?: number;
}

/**
 * @interface Product_ControllerModel
 * Defines the interface for a Product Controller, outlining methods for managing product data.
 */
interface Product_ControllerModel {
	/**
	 * @function createProduct
	 * Creates a new product in the database.
	 * @param {Product_DataModel} data - The product data to be inserted into the database.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	createProduct(data: Product_DataModel): Promise<boolean>;

	/**
	 * @function updateProduct
	 * Updates an existing product in the database.
	 * @param {Product_DataModel} data - The updated product data.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	updateProduct(data: Partial<Product_DataModel>): Promise<boolean>;

	/**
	 * @function deleteProduct
	 * Deletes a product from the database.
	 * @param {number} id - The ID of the product to be deleted.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if successful, `false` otherwise.
	 */
	deleteProduct(id: number): Promise<boolean>;

	/**
	 * @function getProduct
	 * Retrieves a product by its ID from the database.
	 * @param {number} id - The ID of the product to retrieve.
	 * @returns {Promise<Product_DataModel | boolean>} A promise that resolves to the `Product_DataModel` if found, or false if not found.
	 */
	getProduct(id: number): Promise<Product_DataModel | boolean>;

	/**
	 * @function getBoughtWith
	 * Retrieves products frequently purchased with a given product.
	 * @param {number} id - The ID of the product.
	 * @returns {Promise<Product_DataModel[]>} A promise that resolves to an array of `Product_DataModel`.
	 */
	getBoughtWith(id: number): Promise<Product_DataModel[]>;
}

/**
 * @class ProductService
 * Service Controller class for managing product operations (creation, update, deletion, retrieval)
 * using database interactions.
 */
class ProductService implements Product_ControllerModel {
	public async createProduct(data: Product_DataModel): Promise<boolean> {
		loggingService.application("Attempting to create a new product", __filename);
		if (
			!validationService.checkNameFormat(data?.Name) ||
			!data.Description ||
			!validationService.checkPriceFormat(data?.Price) ||
			!validationService.checkIsWholePositiveNumberFormat(data?.Stock)
		) {
			loggingService.error("Invalid product data provided for creation", __filename);
			return false;
		}
		try {
			await query(
				"INSERT INTO Product (Name, Description, Price, Stock, CategoryID, ParentID) VALUES (?, ?, ?, ?, ?, ?)",
				[
					data.Name,
					data.Description,
					data.Price,
					data.Stock,
					data.CategoryID ?? null,
					data.ParentID ?? null,
				]
			);
			loggingService.application("Product created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error creating product: ${error}`, __filename);
			return false;
		}
	}

	public async updateProduct(data: Partial<Product_DataModel>): Promise<boolean> {
		loggingService.application(`Attempting to update product with ID ${data.ID}`, __filename);

		if (!data.ID) {
			loggingService.error("Product ID is required for update", __filename);
			return false;
		}

		if (data.Name && !validationService.checkNameFormat(data.Name)) {
			loggingService.error("Invalid name format", __filename);
			return false;
		}
		if (data.Description && typeof data.Description !== "string") {
			loggingService.error("Invalid description format", __filename);
			return false;
		}
		if (data.Price !== undefined && !validationService.checkPriceFormat(data.Price)) {
			loggingService.error("Invalid price format", __filename);
			return false;
		}
		if (
			data.Stock !== undefined &&
			!validationService.checkIsWholePositiveNumberFormat(data.Stock)
		) {
			loggingService.error("Invalid stock format", __filename);
			return false;
		}
		if (
			data.CategoryID !== undefined &&
			(typeof data.CategoryID !== "number" || !Number.isInteger(data.CategoryID))
		) {
			loggingService.error("Invalid category ID format", __filename);
			return false;
		}
		if (
			data.ParentID !== undefined &&
			(typeof data.ParentID !== "number" || !Number.isInteger(data.ParentID))
		) {
			loggingService.error("Invalid parent ID format", __filename);
			return false;
		}

		try {
			const rows = await query<Product_DataModel>("SELECT * FROM Product WHERE ID = ?", [
				data.ID,
			]);
			const existingProduct = rows[0];

			const updatedProduct: Product_DataModel = {
				...existingProduct,
				...(data.Name && { Name: data.Name }),
				...(data.Description && { Description: data.Description }),
				...(data.Price !== undefined && { Price: data.Price }),
				...(data.Stock !== undefined && { Stock: data.Stock }),
				...(data.CategoryID !== undefined && { CategoryID: data.CategoryID }),
				...(data.ParentID !== undefined && { ParentID: data.ParentID }),
			};

			await query(
				"UPDATE Product SET Name = ?, Description = ?, Price = ?, Stock = ?, CategoryID = ?, ParentID = ? WHERE ID = ?",
				[
					updatedProduct.Name,
					updatedProduct.Description,
					updatedProduct.Price,
					updatedProduct.Stock,
					updatedProduct.CategoryID ?? null,
					updatedProduct.ParentID ?? null,
					updatedProduct.ID,
				]
			);

			loggingService.application(
				`Product with ID ${data.ID} updated successfully`,
				__filename
			);
			return true;
		} catch (error) {
			loggingService.error(`Error updating product with ID ${data.ID}: ${error}`, __filename);
			return false;
		}
	}

	public async deleteProduct(id: Number): Promise<boolean> {
		loggingService.application(`Attempting to delete product with ID ${id}`, __filename);
		try {
			await query("DELETE FROM Review WHERE ProductID = ?", [id]);
			await query("DELETE FROM BasketProduct WHERE ProductID = ?", [id]);
			await query("DELETE FROM Product WHERE ID = ?", [id]);
			loggingService.application(`Product with ID ${id} deleted successfully`, __filename);
			return true;
		} catch (error) {
			console.log(error);
			loggingService.error(`Error deleting product with ID ${id}: ${error}`, __filename);
			return false;
		}
	}

	public async getProduct(id: number): Promise<Product_DataModel | boolean> {
		loggingService.application(`Attempting to retrieve product with ID ${id}`, __filename);
		try {
			const results = await query<Product_DataModel>("SELECT * FROM Product WHERE ID = ?", [
				id,
			]);
			const product: Product_DataModel = results[0];
			if (!product) throw new Error("Product not found"); // Not nice but logs can be later analysed
			loggingService.application(`Product with ID ${id} retrieved successfully`, __filename);
			return product;
		} catch (error) {
			loggingService.error(`Product with ID ${id} not found`, __filename);
			return false;
		}
	}

	public async getBoughtWith(id: Number): Promise<Product_DataModel[]> {
		loggingService.application(`Fetching products bought with product ID ${id}`, __filename);
		try {
			const sqlQuery = `
			    SELECT p.*
			    FROM Product p
			    WHERE p.ID IN (
			        SELECT bp.ProductID 
			        FROM BasketProduct bp
			        WHERE bp.BasketID IN (
			            SELECT bp2.BasketID
			            FROM BasketProduct bp2
			            WHERE bp2.ProductID = ?
			        )
			        AND bp.ProductID <> ? 
			    )
			`;

			const products = (await query<Product_DataModel[][]>(sqlQuery, [
				id,
				id,
			])) as unknown as Product_DataModel[];

			loggingService.application(
				`Products bought with product ID ${id} fetched successfully`,
				__filename
			);
			return products;
		} catch (error) {
			loggingService.error(
				`Error fetching products bought with product ID ${id}: ${error}`,
				__filename
			);
			return [];
		}
	}
}

const productService = new ProductService();
export default productService;
