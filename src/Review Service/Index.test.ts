import sinon, { SinonStub } from "sinon";
import reviewService from "./Index.controller";
import * as db from "../Xternal_Services/database/db";
import { loggingService } from "../Logging_Service/Index.controller";

jest.mock("../Logging_Service/Index.controller");
jest.mock("../Xternal_Services/database/db");

describe("ReviewService", () => {
	let queryStub: SinonStub;
	let loggingApplicationStub: SinonStub;
	let loggingErrorStub: SinonStub;

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
		loggingApplicationStub = sinon.stub(loggingService, "application").returns(void 0);
		loggingErrorStub = sinon.stub(loggingService, "error").returns(void 0);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("createReview", () => {
		it("should create a review successfully", async () => {
			queryStub.resolves([{ ID: 1 }]);
			const result = await reviewService.createReview({
				ProductID: 1,
				AccountID: 1,
				Rating: 5,
				Images: false,
			});
			expect(result).toBe(true);
			expect(
				loggingApplicationStub.calledWith("Review created successfully", sinon.match.string)
			).toBe(true);
		});

		it("should throw an error if required fields are missing", async () => {
			await expect(
				reviewService.createReview({ ProductID: 1, Images: false })
			).rejects.toThrow("Invalid review data provided");
			expect(
				loggingErrorStub.calledWith("Invalid review data provided", sinon.match.string)
			).toBe(true);
		});

		it("should throw an error if rating is invalid", async () => {
			await expect(
				reviewService.createReview({
					ProductID: 1,
					AccountID: 1,
					Rating: 6,
					Images: false,
				})
			).rejects.toThrow("Invalid rating provided");
			expect(loggingErrorStub.calledWith("Invalid rating provided", sinon.match.string)).toBe(
				true
			);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.createReview({
				ProductID: 1,
				AccountID: 1,
				Rating: 5,
				Images: false,
			});
			expect(result).toBe(false);
			expect(
				loggingErrorStub.calledWith(
					"Error creating review: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("updateReview", () => {
		it("should update a review successfully", async () => {
			queryStub.resolves([{ affectedRows: 1 }]);
			const result = await reviewService.updateReview({
				ID: 1,
				ProductID: 1,
				AccountID: 1,
				Rating: 5,
				Images: false,
			});
			expect(result).toBe(true);
			expect(
				loggingApplicationStub.calledWith("Review updated successfully", sinon.match.string)
			).toBe(true);
		});

		it("should throw an error if review ID is missing", async () => {
			await expect(
				reviewService.updateReview({ ProductID: 1, AccountID: 1, Rating: 5, Images: false })
			).rejects.toThrow("Review ID is required for update");
			expect(
				loggingErrorStub.calledWith("Review ID is required for update", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.updateReview({
				ID: 1,
				ProductID: 1,
				AccountID: 1,
				Rating: 5,
				Images: false,
			});
			expect(result).toBe(false);
			expect(
				loggingErrorStub.calledWith(
					"Error updating review: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("deleteReview", () => {
		it("should delete a review successfully", async () => {
			queryStub.resolves([{ affectedRows: 1 }]);
			const result = await reviewService.deleteReview(1);
			expect(result).toBe(true);
			expect(
				loggingApplicationStub.calledWith("Review deleted successfully", sinon.match.string)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.deleteReview(1);
			expect(result).toBe(false);
			expect(
				loggingErrorStub.calledWith(
					"Error deleting review: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("getReviewsByProduct", () => {
		it("should retrieve reviews by product successfully", async () => {
			const mockReviews = [{ ID: 1, ProductID: 1, Rating: 5 }];
			queryStub.resolves(mockReviews);
			const result = await reviewService.getReviewsByProduct(1);
			expect(result).toEqual(mockReviews);
			expect(
				loggingApplicationStub.calledWith(
					"Reviews retrieved successfully",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.getReviewsByProduct(1);
			expect(result).toEqual([]);
			expect(
				loggingErrorStub.calledWith(
					"Error retrieving reviews: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("getReviewsByAccount", () => {
		it("should retrieve reviews by account successfully", async () => {
			const mockReviews = [{ ID: 1, AccountID: 1, Rating: 5 }];
			queryStub.resolves(mockReviews);
			const result = await reviewService.getReviewsByAccount(1);
			expect(result).toEqual(mockReviews);
			expect(
				loggingApplicationStub.calledWith(
					"Reviews retrieved successfully",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.getReviewsByAccount(1);
			expect(result).toEqual([]);
			expect(
				loggingErrorStub.calledWith(
					"Error retrieving reviews: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});

	describe("respondToReview", () => {
		it("should respond to a review successfully", async () => {
			queryStub.resolves([{ ID: 1 }]);
			const result = await reviewService.respondToReview({
				ParentID: 1,
				AccountID: 1,
				Body: "Thank you for your review!",
			});
			expect(result).toBe(true);
			expect(
				loggingApplicationStub.calledWith(
					"Review response created successfully",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should throw an error if parent review ID is missing", async () => {
			await expect(
				reviewService.respondToReview({
					AccountID: 1,
					Body: "Thank you for your review!",
				})
			).rejects.toThrow("Parent review ID is required for response");
			expect(
				loggingErrorStub.calledWith(
					"Parent review ID is required for response",
					sinon.match.string
				)
			).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			queryStub.rejects(new Error("Database error"));
			const result = await reviewService.respondToReview({
				ParentID: 1,
				AccountID: 1,
				Body: "Thank you for your review!",
			});
			expect(result).toBe(false);
			expect(
				loggingErrorStub.calledWith(
					"Error creating review response: Error: Database error",
					sinon.match.string
				)
			).toBe(true);
		});
	});
});
