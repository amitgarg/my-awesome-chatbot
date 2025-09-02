ALTER TABLE "Tag" DROP CONSTRAINT "Tag_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_tag" ON "Tag" USING btree ("name","createdBy");