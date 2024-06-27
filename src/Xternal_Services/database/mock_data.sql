-- Category
INSERT INTO `Category` (`Name`) VALUES
('Electronics'),
('Clothing'),
('Books');

-- Product
INSERT INTO `Product` (`Name`, `Description`, `Price`, `Stock`, `ParentID`, `CategoryID`) VALUES
('Smartphone', 'Latest model smartphone', 699.99, 50, NULL, 1),
('Laptop', 'High-performance laptop', 1299.99, 30, NULL, 1),
('T-shirt', 'Cotton T-shirt', 19.99, 100, NULL, 2);

-- Account
INSERT INTO `Account` (`Email`, `Verified`, `Password`, `FirstName`, `LastName`, `Sex`, `Role`) VALUES
('john@example.com', TRUE, 'hashed_password_1', 'John', 'Doe', 'M', 'USER'),
('jane@example.com', TRUE, 'hashed_password_2', 'Jane', 'Smith', 'F', 'USER'),
('admin@example.com', TRUE, 'hashed_password_3', 'Admin', 'User', 'O', 'ADMIN');

-- Review
INSERT INTO `Review` (`ProductID`, `AccountID`, `Body`, `Images`, `Rating`, `ParentID`) VALUES
(1, 1, 'Great smartphone!', FALSE, 5, NULL),
(2, 2, 'Good laptop for the price', TRUE, 4, NULL),
(1, 3, 'Nice features', FALSE, 4, 1);

-- Collection
INSERT INTO `Collection` (`Name`) VALUES
('Summer Sale'),
('New Arrivals');

-- Basket
INSERT INTO `Basket` (`AccountID`, `Type`, `CollectionID`, `Purchased`) VALUES
(1, 'CHECKOUT', NULL, FALSE),
(2, 'COLLECTION', 1, FALSE);

-- BasketProduct
INSERT INTO `BasketProduct` (`BasketID`, `ProductID`, `Quantity`) VALUES
(1, 1, 1),
(1, 3, 2),
(2, 2, 1);

-- Address
INSERT INTO `Address` (`AddressType`, `AddressMain`, `AddressSecondary`) VALUES
('BRICKMORTAR', '123 Main St', 'Apt 4B'),
('DIGITAL', 'john.doe@email.com', NULL),
('BRICKMORTAR', '456 Elm St', NULL);

-- AccountAddress
INSERT INTO `AccountAddress` (`AccountID`, `AddressID`) VALUES
(1, 1),
(1, 2),
(2, 3);

-- Order
INSERT INTO `Order` (`AccountID`, `BasketID`, `Status`, `AddressID`) VALUES
(1, 1, 'PENDING', 1),
(2, 2, 'SHIPPED', 3);

-- Payment
INSERT INTO `Payment` (`OrderID`, `Amount`, `PaymentType`, `PaymentStatus`) VALUES
(1, 739.97, 'CARD', 'PAID'),
(2, 1299.99, 'PAYPAL', 'PENDING');

-- Auth
INSERT INTO `Auth` (`AccountID`, `Token`, `ExpiresAt`) VALUES
(1, 'token_1', '2024-07-01 00:00:00'),
(2, 'token_2', '2024-07-02 00:00:00'),
(3, 'token_3', '2024-07-03 00:00:00');