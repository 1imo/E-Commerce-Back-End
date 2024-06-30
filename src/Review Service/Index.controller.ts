import { loggingService } from "../Logging_Service/Index.controller";
import { query } from "../Xternal_Services/database/db";

interface ReviewService_DataModel {
	ID?: number;
	ProductID: number;
	AccountID: number;
	Body?: string;
	Images: boolean;
	Rating: number;
	ParentID?: number;
	CreatedAt?: string;
	Likes?: number;
}

interface ReviewService_ControllerModel {
	createReview(data: Partial<ReviewService_DataModel>): Promise<boolean>;
	updateReview(data: Partial<ReviewService_DataModel>): Promise<boolean>;
	deleteReview(id: number): Promise<boolean>;
	getReviewsByProduct(productID: number): Promise<ReviewService_DataModel[]>;
	getReviewsByAccount(accountID: number): Promise<ReviewService_DataModel[]>;
	respondToReview(data: Partial<ReviewService_DataModel>): Promise<boolean>;
}

class ReviewService implements ReviewService_ControllerModel {
	public async createReview(data: Partial<ReviewService_DataModel>): Promise<boolean> {
		loggingService.application("Creating review", __filename);

		if (!data.ProductID || !data.AccountID || !data.Rating) {
			loggingService.error("Invalid review data provided", __filename);
			throw new Error("Invalid review data provided");
		}

		if (data.Rating < 1 || data.Rating > 5 || !Number.isInteger(data.Rating)) {
			loggingService.error("Invalid rating provided", __filename);
			throw new Error("Invalid rating provided");
		}

		try {
			await query<{ ID: number }>(
				"INSERT INTO Review (ProductID, AccountID, Body, Images, Rating, ParentID) VALUES (?, ?, ?, ?, ?, ?)",
				[data.ProductID, data.AccountID, data.Body, data.Images, data.Rating, data.ParentID]
			);
			loggingService.application("Review created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error creating review: ${error}`, __filename);
			return false;
		}
	}

	public async updateReview(data: Partial<ReviewService_DataModel>): Promise<boolean> {
		loggingService.application("Updating review", __filename);

		if (!data.ID) {
			loggingService.error("Review ID is required for update", __filename);
			throw new Error("Review ID is required for update");
		}

		try {
			const result = await query<{ affectedRows: number }>(
				"UPDATE Review SET ProductID = ?, AccountID = ?, Body = ?, Images = ?, Rating = ?, ParentID = ? WHERE ID = ?",
				[
					data.ProductID,
					data.AccountID,
					data.Body,
					data.Images,
					data.Rating,
					data.ParentID,
					data.ID,
				]
			);
			if (!result[0]) throw new Error("No rows affected");

			loggingService.application("Review updated successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error updating review: ${error}`, __filename);
			return false;
		}
	}

	public async deleteReview(id: number): Promise<boolean> {
		loggingService.application("Deleting review", __filename);

		try {
			const result = await query<{ affectedRows: number }>(
				"DELETE FROM Review WHERE ID = ?",
				[id]
			);
			if (!result[0]) throw new Error("No rows affected");
			loggingService.application("Review deleted successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error deleting review: ${error}`, __filename);
			return false;
		}
	}

	public async getReviewsByProduct(productID: number): Promise<ReviewService_DataModel[]> {
		loggingService.application("Retrieving reviews by product", __filename);

		try {
			const reviews = await query<ReviewService_DataModel[]>(
				"SELECT * FROM Review WHERE ProductID = ?",
				[productID]
			);
			loggingService.application("Reviews retrieved successfully", __filename);
			return reviews.flat();
		} catch (error) {
			loggingService.error(`Error retrieving reviews: ${error}`, __filename);
			return [];
		}
	}

	public async getReviewsByAccount(accountID: number): Promise<ReviewService_DataModel[]> {
		loggingService.application("Retrieving reviews by account", __filename);

		try {
			const reviews = await query<ReviewService_DataModel[]>(
				"SELECT * FROM Review WHERE AccountID = ?",
				[accountID]
			);
			loggingService.application("Reviews retrieved successfully", __filename);
			return reviews.flat();
		} catch (error) {
			loggingService.error(`Error retrieving reviews: ${error}`, __filename);
			return [];
		}
	}

	public async respondToReview(data: Partial<ReviewService_DataModel>): Promise<boolean> {
		loggingService.application("Responding to review", __filename);

		if (!data.ParentID) {
			loggingService.error("Parent review ID is required for response", __filename);
			throw new Error("Parent review ID is required for response");
		}

		try {
			await query<{ ID: number }>(
				"INSERT INTO Review (ProductID, AccountID, Body, Images, Rating, ParentID) VALUES (?, ?, ?, ?, ?, ?)",
				[data.ProductID, data.AccountID, data.Body, data.Images, data.Rating, data.ParentID]
			);
			loggingService.application("Review response created successfully", __filename);
			return true;
		} catch (error) {
			loggingService.error(`Error creating review response: ${error}`, __filename);
			return false;
		}
	}
}

export const reviewService = new ReviewService();
export default reviewService;
