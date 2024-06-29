import { loggingService } from "../Logging_Service/Index.controller";
import { Product_DataModel } from "../Product_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";
import validationService from "../Validation_Service/Index.controller";
import discountService from "../Discount Service/Index.controller";

interface BasketItem_DataModel {
	BasketID: number;
	Quantity: number;
	ProductID: number;
	Price: number;
}

/**
 * @interface BasketService_ControllerModel
 * Defines the interface for a Basket Service, outlining methods for managing baskets.
 */
interface BasketService_ControllerModel {
	/**
	 * @function createBasket
	 * Creates a new basket for the user.
	 * @param {number} userID - The ID of the user.
	 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
	 */
	createBasket(userID: number): Promise<boolean>;

	/**
	 * @function manageProductQuantitiesInBasket
	 * Manages the quantities of products in the user's basket.
	 * @param {number} userID - The ID of the user.
	 * @param {number} productID - The ID of the product.
	 * @param {number} quantity - The quantity of the product.
	 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
	 */
	manageProductQuantitiesInBasket(
		userID: number,
		productID: number,
		quantity: number
	): Promise<boolean>;

	/**
	 * @function getBasket
	 * Retrieves the basket for the user.
	 * @param {number} userID - The ID of the user.
	 * @returns {Promise<Partial<Product_DataModel>[]>} A promise that resolves to an array of products in the basket.
	 */
	getBasket(userID: number): Promise<Partial<BasketItem_DataModel>[]>;

	/**
	 * @function getDiscountPrice
	 * Retrieves the total price of the basket after applying discounts.
	 * @param {number} basketID - The ID of the basket.
	 * @returns {Promise<number>} A promise that resolves to the total discounted price.
	 */
	getDiscountPrice(basketID: number): Promise<number>;
}

/**
 * @class BasketService
 * Service class for managing basket operations (creation, product quantity management, retrieval)
 * using database interactions.
 */
class BasketService implements BasketService_ControllerModel {
	/**
	 * @inheritdoc
	 */
	public async createBasket(userID: number): Promise<boolean> {
		loggingService.application(`Creating basket for user: ${userID}`, __filename);
		try {
			await query("INSERT INTO Basket (AccountID, Type) VALUES (?, 'CHECKOUT')", [userID]);
			loggingService.application("Basket created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.application(`Error creating basket: ${error}`, __filename);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async manageProductQuantitiesInBasket(
		userID: number,
		productID: number,
		quantity: number
	): Promise<boolean> {
		try {
			if (!validationService.checkIsWholePositiveNumberFormat(quantity)) {
				loggingService.application("Invalid quantity format", __filename);
				return false;
			}

			loggingService.application(
				`Managing product quantities in basket for user: ${userID}`,
				__filename
			);

			const basket = await query<{ ID: number }>(
				"SELECT ID FROM Basket WHERE AccountID = ? AND Purchased = FALSE",
				[userID]
			);
			if (basket.length === 0) {
				loggingService.application("No active basket found for user", __filename);
				return false;
			}

			const basketID = basket[0].ID;

			const existingProduct = await query<{ Quantity: number }>(
				"SELECT Quantity FROM BasketProduct WHERE BasketID = ? AND ProductID = ?",
				[basketID, productID]
			);

			if (existingProduct.length > 0) {
				const newQuantity = existingProduct[0].Quantity + quantity;
				if (newQuantity <= 0) {
					await query("DELETE FROM BasketProduct WHERE BasketID = ? AND ProductID = ?", [
						basketID,
						productID,
					]);
				} else {
					await query(
						"UPDATE BasketProduct SET Quantity = ? WHERE BasketID = ? AND ProductID = ?",
						[newQuantity, basketID, productID]
					);
				}
			} else if (quantity > 0) {
				await query(
					"INSERT INTO BasketProduct (BasketID, ProductID, Quantity) VALUES (?, ?, ?)",
					[basketID, productID, quantity]
				);
			}

			loggingService.application("Product quantities managed successfully", __filename);
			return true;
		} catch (error) {
			loggingService.application(
				`Error managing product quantities in basket: ${error}`,
				__filename
			);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async getBasket(userID: number): Promise<BasketItem_DataModel[]> {
		loggingService.application(`Fetching basket for user: ${userID}`, __filename);
		try {
			const basket = await query<{ ID: number }>(
				"SELECT ID FROM Basket WHERE AccountID = ? AND Purchased = FALSE AND Type = 'CHECKOUT'",
				[userID]
			);
			if (basket.length === 0) {
				loggingService.application("No active basket found for user", __filename);
				return [];
			}

			const basketID = basket[0].ID;

			const products = await query<BasketItem_DataModel>(
				`SELECT bp.BasketID, bp.ProductID, bp.Quantity, p.Price 
                FROM BasketProduct bp 
                JOIN Product p ON bp.ProductID = p.ID 
                WHERE bp.BasketID = ?`,
				[basketID]
			);

			loggingService.application("Basket fetched successfully", __filename);
			return products;
		} catch (error) {
			loggingService.application(`Error fetching basket: ${error}`, __filename);
			return [];
		}
	}

	/**
	 * @inheritdoc
	 */
	public async getDiscountPrice(basketID: number): Promise<number> {
		loggingService.application(
			`Fetching discount price for basket ID: ${basketID}`,
			__filename
		);
		try {
			const [basket, discounts] = await Promise.all([
				this.getBasketItems(basketID),
				discountService.getDiscountsInBasket(basketID),
			]);

			if (!basket || basket.length === 0) {
				loggingService.application("Basket is empty", __filename);
				return 0;
			}

			let totalDiscountPrice = 0;
			for (const item of basket) {
				const itemPrice = item.Price * item.Quantity;
				const discount = discounts.find((d) => d.ProductID === item.ProductID);
				if (discount) {
					const discountAmount = (itemPrice * discount.Discount) / 100;
					totalDiscountPrice += discountAmount;
				}
			}

			loggingService.application("Discount price calculated successfully", __filename);
			return totalDiscountPrice;
		} catch (error) {
			loggingService.application(
				`Error fetching discount price for basket: ${error}`,
				__filename
			);
			return 0;
		}
	}

	private async getBasketItems(basketID: number): Promise<BasketItem_DataModel[]> {
		return await query<BasketItem_DataModel>(
			`SELECT bp.BasketID, bp.ProductID, bp.Quantity, p.Price 
            FROM BasketProduct bp 
            JOIN Product p ON bp.ProductID = p.ID 
            WHERE bp.BasketID = ?`,
			[basketID]
		);
	}
}

export const basketService = new BasketService();
export default basketService;
