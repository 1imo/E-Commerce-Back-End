import sinon, { SinonStub } from "sinon";
import productService from "./Index.controller";
import { Product_DataModel } from "./Index.controller";
import * as db from "../Xternal_Services/database/db";

describe("ProductService", () => {
	let queryStub: SinonStub;

	beforeEach(() => {
		queryStub = sinon.stub(db, "query");
	});

	afterEach(() => {
		queryStub.restore();
	});

	// CREATE PRODUCT TESTS
	it("should create a new product with valid data", async () => {
		const newProduct: Product_DataModel = {
			Name: "New Test Product",
			Description: "New Test Description",
			Price: 29.99,
			Stock: 15,
			CategoryID: 1,
		};
		queryStub.resolves({ affectedRows: 1 });

		const result = await productService.createProduct(newProduct);
		expect(result).toBe(true);
		expect(queryStub.calledOnce).toBe(true);
		expect(queryStub.firstCall.args[0]).toBe(
			"INSERT INTO Product (Name, Description, Price, Stock, CategoryID, ParentID) VALUES (?, ?, ?, ?, ?, ?)"
		);
		expect(queryStub.firstCall.args[1]).toEqual([
			newProduct.Name,
			newProduct.Description,
			newProduct.Price,
			newProduct.Stock,
			newProduct.CategoryID,
			null,
		]);
	});

	it("should reject creation of a product with invalid data (missing required fields)", async () => {
		const invalidProduct = {
			Description: "Incomplete product data",
			Stock: 10,
		};

		const result = await productService.createProduct(
			invalidProduct as unknown as Product_DataModel
		);
		expect(result).toBe(false);
		expect(queryStub.notCalled).toBe(true);
	});

	it("should reject creation of a product with invalid data (wrong data types)", async () => {
		const invalidProduct = {
			Name: 123,
			Description: "Invalid data types",
			Price: "not a number",
			Stock: "ten",
			CategoryID: "one",
		};

		const result = await productService.createProduct(
			invalidProduct as unknown as Product_DataModel
		);
		expect(result).toBe(false);
		expect(queryStub.notCalled).toBe(true);
	});

	// GET PRODUCT TESTS
	it("should fetch an existing product", async () => {
		const existingProduct: Product_DataModel = {
			ID: 1,
			Name: "Smartphone",
			Description: "Latest model smartphone",
			Price: 699.99,
			Stock: 50,
			CategoryID: 1,
		};
		queryStub.resolves([existingProduct]);

		const result = await productService.getProduct(1);
		expect(result).toEqual(existingProduct);
	});

	it("should return false if a product is not found", async () => {
		queryStub.resolves([]);

		const result = await productService.getProduct(999);
		expect(result).toBe(false);
	});

	// UPDATE PRODUCT TESTS
	it("should update an existing product", async () => {
		const updatedProduct: Product_DataModel = {
			ID: 1,
			Name: "Updated Smartphone",
			Description: "Updated description",
			Price: 799.99,
			Stock: 45,
			CategoryID: 1,
		};
		queryStub.resolves({ affectedRows: 1 });

		const result = await productService.updateProduct(updatedProduct);
		expect(result).toBe(true);

		queryStub.withArgs("SELECT * FROM Product WHERE ID = ?", [1]).resolves([updatedProduct]);
		const fetchedProduct = await productService.getProduct(1);
		expect(fetchedProduct).toEqual(updatedProduct);
	});

	it("should return false if updating a product without ID", async () => {
		const updatedProduct: Partial<Product_DataModel> = {};
		const result = await productService.updateProduct(updatedProduct as Product_DataModel);
		expect(result).toBe(false);
	});

	it("should handle errors when updating a product", async () => {
		const existingProduct: Product_DataModel = {
			ID: 1,
			Name: "Test Product",
			Description: "Test Description",
			Price: 10.99,
			Stock: 5,
			CategoryID: 1,
		};
		queryStub.rejects(new Error("Database error"));

		const result = await productService.updateProduct(existingProduct);
		expect(result).toBe(false);
	});

	// DELETE PRODUCT TESTS
	it("should delete an existing product", async () => {
		queryStub.resolves({ affectedRows: 1 });

		const result = await productService.deleteProduct(3);
		expect(result).toBe(true);

		queryStub.withArgs("SELECT * FROM Product WHERE ID = ?", [3]).resolves([]);
		queryStub.withArgs("SELECT * FROM Review WHERE ProductID = ?", [3]).resolves([]);
		queryStub.withArgs("SELECT * FROM BasketProduct WHERE ProductID = ?", [3]).resolves([]);

		const fetchedProduct = await productService.getProduct(3);
		expect(fetchedProduct).toBe(false);
	});

	// GET BOUGHT WITH TESTS
	it("should fetch products bought together with a given product", async () => {
		const boughtWithProducts: Product_DataModel[] = [
			{
				ID: 3,
				Name: "T-shirt",
				Description: "Cotton T-shirt",
				Price: 19.99,
				Stock: 100,
				CategoryID: 2,
			},
		];
		queryStub.withArgs(sinon.match.string, [1, 1]).resolves(boughtWithProducts);

		const result = await productService.getBoughtWith(1);
		expect(result).toEqual(boughtWithProducts);
	});
});
