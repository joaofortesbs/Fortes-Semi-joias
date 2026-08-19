CREATE TABLE `orders` (
	`id` varchar(64) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`resellerId` varchar(64),
	`origin` enum('direct','reseller') NOT NULL,
	`status` varchar(32) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`commission` decimal(12,2) NOT NULL,
	`payload` json NOT NULL,
	`saleDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_ownerOpenId_users_openId_fk` FOREIGN KEY (`ownerOpenId`) REFERENCES `users`(`openId`) ON DELETE no action ON UPDATE no action;