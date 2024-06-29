import { loggingService } from "../Logging_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";
import validationService from "../Validation_Service/Index.controller";

/**
 * @interface DiscountService_DataModel
 * Represents the data model for a discount.
 */
interface DiscountService_DataModel {
	ID?: number;
	Type: "MULTIBUY" | "MULTIITEM" | "PERCENTAGEOFF" | "PERCENTAGEOFFTOTAL";
	ProductID?: number;
	Code?: string;
	Quantity: number;
	Discount: number;
	OtherProductID?: number;
	OtherProductQuantity?: number;
}

/**
 * @interface DiscountService_ControllerModel
 * Defines the interface for a Discount Controller, outlining methods for managing discounts.
 */
interface DiscountService_ControllerModel {
	/**
	 * @function createDiscount
	 * Creates a new discount in the system.
	 * @param {DiscountService_DataModel} data - The discount data to be inserted.
	 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
	 */
	createDiscount(data: DiscountService_DataModel): Promise<boolean>;

	/**
	 * @function updateDiscount
	 * Updates an existing discount in the system.
	 * @param {number} id - The ID of the discount to be updated.
	 * @param {Partial<DiscountService_DataModel>} data - The updated discount data.
	 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
	 */
	updateDiscount(id: number, data: Partial<DiscountService_DataModel>): Promise<boolean>;

	/**
	 * @function deleteDiscount
	 * Deletes a discount from the system.
	 * @param {number} id - The ID of the discount to be deleted.
	 * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
	 */
	deleteDiscount(id: number): Promise<boolean>;

	/**
	 * @function getDiscount
	 * Retrieves a discount by its ID.
	 * @param {number} id - The ID of the discount to retrieve.
	 * @returns {Promise<DiscountService_DataModel | boolean>} A promise that resolves to the discount data if found, or false if not found.
	 */
	getDiscount(id: number): Promise<DiscountService_DataModel | boolean>;

	/**
	 * @function getAllDiscounts
	 * Retrieves all discounts in the system.
	 * @returns {Promise<DiscountService_DataModel[]>} A promise that resolves to an array of all discounts.
	 */
	getAllDiscounts(): Promise<DiscountService_DataModel[]>;
}

/**
 * @class DiscountService
 * Service Controller class for managing discount operations (creation, update, deletion, retrieval)
 * using database interactions.
 */
class DiscountService implements DiscountService_ControllerModel {
	/**
	 * @inheritdoc
	 */
	public async createDiscount(data: DiscountService_DataModel): Promise<boolean> {
		loggingService.application("Creating new discount", __filename);

		if (
			!validationService.checkDiscountType(data.Type) ||
			!validationService.checkIsWholePositiveNumberFormat(data.Quantity) ||
			!validationService.checkPriceFormat(data.Discount)
		) {
			loggingService.error("Invalid discount data provided", __filename);
			return false;
		}

		try {
			await query(
				"INSERT INTO Discount (Type, ProductID, Code, Quantity, Discount, OtherProductID, OtherProductQuantity) VALUES (?, ?, ?, ?, ?, ?, ?)",
				[
					data.Type,
					data.ProductID ?? null,
					data.Code ?? null,
					data.Quantity,
					data.Discount,
					data.OtherProductID ?? null,
					data.OtherProductQuantity ?? null,
				]
			);
			loggingService.application("Discount created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error creating discount: ${error}`, __filename);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async updateDiscount(
		id: number,
		data: Partial<DiscountService_DataModel>
	): Promise<boolean> {
		loggingService.application(`Updating discount with ID ${id}`, __filename);

		if (
			(data.Type && !validationService.checkDiscountType(data.Type)) ||
			(data.Quantity && !validationService.checkIsWholePositiveNumberFormat(data.Quantity)) ||
			(data.Discount && !validationService.checkPriceFormat(data.Discount))
		) {
			loggingService.error("Invalid discount data provided for update", __filename);
			return false;
		}

		try {
			const existingDiscount = await query<DiscountService_DataModel[]>(
				"SELECT * FROM Discount WHERE ID = ?",
				[id]
			);
			if (existingDiscount.length === 0) {
				throw new Error("Discount not found");
			}

			const updatedData: Partial<DiscountService_DataModel> = {
				...existingDiscount[0],
				...data,
			};

			await query(
				"UPDATE Discount SET Type = ?, ProductID = ?, Code = ?, Quantity = ?, Discount = ?, OtherProductID = ?, OtherProductQuantity = ? WHERE ID = ?",
				[
					updatedData.Type,
					updatedData.ProductID ?? null,
					updatedData.Code ?? null,
					updatedData.Quantity,
					updatedData.Discount,
					updatedData.OtherProductID ?? null,
					updatedData.OtherProductQuantity ?? null,
					id,
				]
			);
			loggingService.application(`Discount with ID ${id} updated successfully`, __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error updating discount with ID ${id}: ${error}`, __filename);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async deleteDiscount(id: number): Promise<boolean> {
		loggingService.application(`Deleting discount with ID ${id}`, __filename);
		try {
			await query("DELETE FROM Discount WHERE ID = ?", [id]);
			loggingService.application(`Discount with ID ${id} deleted successfully`, __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error deleting discount with ID ${id}: ${error}`, __filename);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async getDiscount(id: number): Promise<DiscountService_DataModel | boolean> {
		loggingService.application(`Retrieving discount with ID ${id}`, __filename);
		try {
			const results = await query<DiscountService_DataModel>(
				"SELECT * FROM Discount WHERE ID = ?",
				[id]
			);
			const discount: DiscountService_DataModel = results[0];
			if (!discount) throw new Error("Discount not found");
			loggingService.application(`Discount with ID ${id} retrieved successfully`, __filename);
			return discount;
		} catch (error) {
			loggingService.error(`Error retrieving discount with ID ${id}: ${error}`, __filename);
			return false;
		}
	}

	/**
	 * @inheritdoc
	 */
	public async getAllDiscounts(): Promise<DiscountService_DataModel[]> {
		loggingService.application("Retrieving all discounts", __filename);
		try {
			const results = await query<DiscountService_DataModel[]>("SELECT * FROM Discount");
			loggingService.application("All discounts retrieved successfully", __filename);
			return results.flat();
		} catch (error) {
			loggingService.error(`Error retrieving all discounts: ${error}`, __filename);
			return [];
		}
	}

	public async getDiscountsInBasket(basketID: number): Promise<DiscountService_DataModel[]> {
		loggingService.application(
			`Retrieving discounts for basket with ID ${basketID}`,
			__filename
		);
		try {
			const results = await query<DiscountService_DataModel[]>(
				"SELECT * FROM Discount WHERE BasketID = ?",
				[basketID]
			);
			loggingService.application(
				`Discounts for basket with ID ${basketID} retrieved successfully`,
				__filename
			);
			return results.flat();
		} catch (error) {
			loggingService.error(
				`Error retrieving discounts for basket with ID ${basketID}: ${error}`,
				__filename
			);
			return [];
		}
	}
}

const discountService = new DiscountService();
export default discountService;
