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
	updateProduct(data: Product_DataModel): Promise<boolean>;

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
		if (
			!data.Name ||
			!data.Description ||
			typeof data.Price !== "number" ||
			typeof data.Stock !== "number"
		) {
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
			return true;
		} catch (error) {
			return false;
		}
	}

	public async updateProduct(data: Product_DataModel): Promise<boolean> {
		if (!data.ID) return false;

		try {
			await query(
				"UPDATE Product SET Name = ?, Description = ?, Price = ?, Stock = ?, CategoryID = ?, ParentID = ? WHERE ID = ?",
				[
					data.Name,
					data.Description,
					data.Price,
					data.Stock,
					data.CategoryID ?? null,
					data.ParentID ?? null,
					data.ID,
				]
			);
			return true;
		} catch (error) {
			return false;
		}
	}

	public async deleteProduct(id: Number): Promise<boolean> {
		try {
			await query("DELETE FROM Review WHERE ProductID = ?", [id]);
			await query("DELETE FROM BasketProduct WHERE ProductID = ?", [id]);
			await query("DELETE FROM Product WHERE ID = ?", [id]);
			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	public async getProduct(id: number): Promise<Product_DataModel | boolean> {
		const results = await query<Product_DataModel>("SELECT * FROM Product WHERE ID = ?", [id]);
		if (results.length > 0) {
			return results[0];
		} else {
			return false;
		}
	}

	public async getBoughtWith(id: Number): Promise<Product_DataModel[]> {
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

		return products;
	}
}

const productService = new ProductService();
export default productService;
