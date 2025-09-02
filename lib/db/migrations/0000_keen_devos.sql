CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"messages" json NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(64)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(64) NOT NULL UNIQUE,
	"createdAt" timestamp NOT NULL DEFAULT now(),
	"createdBy" uuid NOT NULL,
	CONSTRAINT "Tag_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatTag" (
	"chatId" uuid NOT NULL,
	"tagId" uuid NOT NULL,
	PRIMARY KEY ("chatId", "tagId"),
	CONSTRAINT "ChatTag_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE,
	CONSTRAINT "ChatTag_tagId_Tag_id_fk" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
);
--> statement-breakpoint