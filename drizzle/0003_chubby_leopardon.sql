ALTER TABLE `importedFiles` ADD `originalFilename` varchar(255);--> statement-breakpoint
ALTER TABLE `importedFiles` ADD `status` varchar(32) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `importedFiles` ADD `fieldsExtracted` int DEFAULT 0;