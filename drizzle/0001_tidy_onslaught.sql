CREATE TABLE `private_product_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`productId` varchar(64) NOT NULL,
	`costBase` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `private_product_costs_id` PRIMARY KEY(`id`),
	CONSTRAINT `private_product_costs_owner_product_unique` UNIQUE(`ownerOpenId`,`productId`)
);
--> statement-breakpoint
ALTER TABLE `private_product_costs` ADD CONSTRAINT `private_product_costs_ownerOpenId_users_openId_fk` FOREIGN KEY (`ownerOpenId`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;