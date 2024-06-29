import sinon, { SinonStub } from "sinon";
import basketService from "./Index.controller";
import { loggingService } from "../Logging_Service/Index.controller";
import * as db from "../Xternal_Services/database/db";
import validationService from "../Validation_Service/Index.controller";
import discountService from "../Discount Service/Index.controller";

describe("BasketService", () => {
	let queryStub: SinonStub;
	let loggingServiceStub: SinonStub;
	let validationServiceStub: SinonStub;
	let discountServiceStub: SinonStub;

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
		loggingServiceStub = sinon.stub(loggingService, "application");
		validationServiceStub = sinon.stub(validationService, "checkIsWholePositiveNumberFormat");
		discountServiceStub = sinon.stub(discountService, "getDiscountsInBasket");

		// Reset the loggingServiceStub
		loggingServiceStub.resetHistory();
	});

	afterEach(() => {
		sinon.restore();
	});

	describe("createBasket", () => {
		it("should create a new basket for the user", async () => {
			const userID = 1;

			queryStub.resolves({ insertId: 1 });

			const result = await basketService.createBasket(userID);

			expect(result).toBe(true);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const userID = 1;

			queryStub.rejects(new Error("Database error"));

			const result = await basketService.createBasket(userID);

			expect(result).toBe(false);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});
	});

	describe("getBasket", () => {
		it("should retrieve the basket for the user", async () => {
			const userID = 1;
			const basketID = 1;
			const basket = [
				{ BasketID: basketID, ProductID: 1, Quantity: 2, Price: 50 },
				{ BasketID: basketID, ProductID: 2, Quantity: 1, Price: 100 },
			];

			queryStub.onFirstCall().resolves([{ ID: basketID }]);
			queryStub.onSecondCall().resolves(basket);

			const result = await basketService.getBasket(userID);

			expect(result).toEqual(basket);
			expect(queryStub.calledTwice).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const userID = 1;

			queryStub.onFirstCall().rejects(new Error("Database error"));

			const result = await basketService.getBasket(userID);

			expect(result).toEqual([]);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});
	});

	describe("manageProductQuantitiesInBasket", () => {
		it("should add a product to the basket", async () => {
			const userID = 1;
			const productID = 1;
			const quantity = 2;

			queryStub.onFirstCall().resolves([{ ID: 1 }]);
			queryStub.onSecondCall().resolves([]);
			validationServiceStub.returns(true);

			const result = await basketService.manageProductQuantitiesInBasket(
				userID,
				productID,
				quantity
			);

			expect(result).toBe(true);
			expect(queryStub.callCount).toBe(3);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should update the quantity of an existing product in the basket", async () => {
			const userID = 1;
			const productID = 1;
			const quantity = 3;

			queryStub.onFirstCall().resolves([{ ID: 1 }]);
			queryStub.onSecondCall().resolves([{ Quantity: 2 }]);
			validationServiceStub.returns(true);

			const result = await basketService.manageProductQuantitiesInBasket(
				userID,
				productID,
				quantity
			);

			expect(result).toBe(true);
			expect(queryStub.callCount).toBe(3);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should remove a product from the basket if the new quantity is zero", async () => {
			const userID = 1;
			const productID = 1;
			const quantity = -2;

			queryStub.onFirstCall().resolves([{ ID: 1 }]);
			queryStub.onSecondCall().resolves([{ Quantity: 2 }]);
			validationServiceStub.returns(true);

			const result = await basketService.manageProductQuantitiesInBasket(
				userID,
				productID,
				quantity
			);

			expect(result).toBe(true);
			expect(queryStub.callCount).toBe(3);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should return false for invalid quantity format", async () => {
			const userID = 1;
			const productID = 1;
			const quantity = "invalid";

			validationServiceStub.returns(false);

			const result = await basketService.manageProductQuantitiesInBasket(
				userID,
				productID,
				quantity as any
			);

			expect(result).toBe(false);
			expect(loggingServiceStub.calledOnce).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const userID = 1;
			const productID = 1;
			const quantity = 2;

			queryStub.onFirstCall().resolves([{ ID: 1 }]);
			queryStub.onSecondCall().rejects(new Error("Database error"));
			validationServiceStub.returns(true);

			const result = await basketService.manageProductQuantitiesInBasket(
				userID,
				productID,
				quantity
			);

			expect(result).toBe(false);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});
	});

	describe("getDiscountPriceForBasket", () => {
		it("should calculate the total discount price for the basket", async () => {
			const basketID = 1;
			const basket = [
				{ BasketID: 1, ProductID: 1, Quantity: 2, Price: 50 },
				{ BasketID: 1, ProductID: 2, Quantity: 1, Price: 100 },
			];
			const discounts = [
				{ ProductID: 1, Discount: 10 },
				{ ProductID: 2, Discount: 20 },
			];

			queryStub.resolves(basket);
			discountServiceStub.resolves(discounts);

			const result = await basketService.getDiscountPrice(basketID);

			expect(result).toBe(30); // 10% of 100 + 20% of 100
			expect(queryStub.calledOnce).toBe(true);
			expect(discountServiceStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should return 0 if no discounts are found", async () => {
			const basketID = 1;
			const basket = [
				{ BasketID: 1, ProductID: 1, Quantity: 2, Price: 50 },
				{ BasketID: 1, ProductID: 2, Quantity: 1, Price: 100 },
			];

			queryStub.resolves(basket);
			discountServiceStub.resolves([]);

			const result = await basketService.getDiscountPrice(basketID);

			expect(result).toBe(0);
			expect(queryStub.calledOnce).toBe(true);
			expect(discountServiceStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});

		it("should handle database errors gracefully", async () => {
			const basketID = 1;

			queryStub.rejects(new Error("Database error"));

			const result = await basketService.getDiscountPrice(basketID);

			expect(result).toBe(0);
			expect(queryStub.calledOnce).toBe(true);
			expect(loggingServiceStub.calledTwice).toBe(true);
		});
	});
});
