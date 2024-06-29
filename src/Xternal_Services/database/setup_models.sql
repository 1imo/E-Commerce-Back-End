CREATE TABLE `Category` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(255) NOT NULL
);

CREATE TABLE `Product` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(255) NOT NULL,
  `Description` TEXT,
  `Price` DECIMAL(10, 2) NOT NULL,
  `Stock` INT NOT NULL,
  `ParentID` INT,
  `CategoryID` INT NOT NULL,
  FOREIGN KEY (`ParentID`) REFERENCES `Product`(`ID`),
  FOREIGN KEY (`CategoryID`) REFERENCES `Category`(`ID`),
  INDEX `idx_product_category` (`CategoryID`)
);

CREATE TABLE `Account` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Email` VARCHAR(255) NOT NULL,
  `Verified` BOOLEAN DEFAULT FALSE,
  `Password` VARCHAR(255) NOT NULL,
  `FirstName` VARCHAR(255) NOT NULL,
  `LastName` VARCHAR(255) NOT NULL,
  `Sex` ENUM('M', 'F', 'O') NOT NULL,
  `Role` ENUM('ADMIN', 'USER') NOT NULL,
  INDEX `idx_account_email` (`Email`)
);

CREATE TABLE `Review` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `ProductID` INT NOT NULL,
  `AccountID` INT NOT NULL,
  `Body` TEXT,
  `Images` BOOLEAN,
  `Rating` INT NOT NULL,
  `ParentID` INT,
  `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `Likes` INT DEFAULT 0,
  FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ID`),
  FOREIGN KEY (`AccountID`) REFERENCES `Account`(`ID`),
  FOREIGN KEY (`ParentID`) REFERENCES `Review`(`ID`),
  INDEX `idx_review_product` (`ProductID`),
  INDEX `idx_review_account` (`AccountID`)
);

CREATE TABLE `Collection` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `Name` VARCHAR(255) NOT NULL
);

CREATE TABLE `Basket` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `AccountID` INT NOT NULL,
  `Type` ENUM('CHECKOUT', 'COLLECTION') NOT NULL,
  `CollectionID` INT,
  `Purchased` BOOLEAN DEFAULT FALSE,
  `UpdatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`AccountID`) REFERENCES `Account`(`ID`),
  FOREIGN KEY (`CollectionID`) REFERENCES `Collection`(`ID`),
  INDEX `idx_basket_account` (`AccountID`)
);

CREATE TABLE `BasketProduct` (
  `BasketID` INT NOT NULL,
  `ProductID` INT NOT NULL,
  `Quantity` INT NOT NULL,
  PRIMARY KEY (`BasketID`, `ProductID`),
  FOREIGN KEY (`BasketID`) REFERENCES `Basket`(`ID`),
  FOREIGN KEY (`ProductID`) REFERENCES `Product`(`ID`),
  INDEX `idx_basketproduct_basket` (`BasketID`),
  INDEX `idx_basketproduct_product` (`ProductID`)
);

CREATE TABLE `Address` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `AddressType` ENUM('DIGITAL', 'BRICKMORTAR') NOT NULL,
  `AddressMain` VARCHAR(255) NOT NULL,
  `AddressSecondary` VARCHAR(255)
);

CREATE TABLE `AccountAddress` (
  `AccountID` INT NOT NULL,
  `AddressID` INT NOT NULL,
  PRIMARY KEY (`AccountID`, `AddressID`),
  FOREIGN KEY (`AccountID`) REFERENCES `Account`(`ID`),
  FOREIGN KEY (`AddressID`) REFERENCES `Address`(`ID`)
);

CREATE TABLE `Order` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `AccountID` INT NOT NULL,
  `BasketID` INT NOT NULL,
  `Status` ENUM('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL,
  `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `AddressID` INT NOT NULL,
  FOREIGN KEY (`AccountID`) REFERENCES `Account`(`ID`),
  FOREIGN KEY (`BasketID`) REFERENCES `Basket`(`ID`),
  FOREIGN KEY (`AddressID`) REFERENCES `Address`(`ID`),
  INDEX `idx_order_account` (`AccountID`),
  INDEX `idx_order_status` (`Status`)
);

CREATE TABLE `Payment` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `OrderID` INT NOT NULL,
  `Amount` DECIMAL(10, 2) NOT NULL,
  `PaymentType` ENUM('CARD', 'PAYPAL') NOT NULL,
  `PaymentStatus` ENUM('PENDING', 'PAID', 'REFUNDED') NOT NULL,
  `CreatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`OrderID`) REFERENCES `Order`(`ID`),
  INDEX `idx_payment_order` (`OrderID`)
);

CREATE TABLE `Auth` (
  `ID` INT AUTO_INCREMENT PRIMARY KEY,
  `AccountID` INT NOT NULL,
  `Token` VARCHAR(255) NOT NULL,
  `ExpiresAt` TIMESTAMP NOT NULL,
  FOREIGN KEY (`AccountID`) REFERENCES `Account`(`ID`),
  INDEX `idx_auth_account` (`AccountID`)
);

CREATE TABLE Discount (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  Type ENUM('MULTIBUY', 'MULTIITEM', 'PERCENTAGEOFF', 'PERCENTAGEOFFTOTAL') NOT NULL,
  ProductID INT,
  Code VARCHAR(255) UNIQUE,
  Quantity INT NOT NULL,
  Discount DECIMAL(10, 2) NOT NULL,
  OtherProductID INT NULL,
  OtherProductQuantity INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ProductID) REFERENCES Product(ID),
  FOREIGN KEY (OtherProductID) REFERENCES Product(ID),
  INDEX idx_discount_product (ProductID),
  INDEX idx_discount_other_product (OtherProductID),
  CHECK (
    (Type = 'MULTIBUY' AND ProductID IS NOT NULL AND Quantity IS NOT NULL AND Discount IS NOT NULL) OR
    (Type = 'MULTIITEM' AND ProductID IS NOT NULL AND OtherProductID IS NOT NULL AND OtherProductQuantity IS NOT NULL AND Discount IS NOT NULL) OR
    (Type = 'PERCENTAGEOFF' AND ProductID IS NOT NULL AND Discount IS NOT NULL) OR
    (Type = 'PERCENTAGEOFFTOTAL' AND Discount IS NOT NULL)
  )
);

