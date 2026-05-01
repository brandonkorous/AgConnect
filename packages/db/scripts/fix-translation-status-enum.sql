-- One-time fix: rename translation_status (snake_case) to TranslationStatus (PascalCase)
-- to match Prisma's expected enum type naming. Plus rename the column type accordingly.

ALTER TABLE "translation_keys" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "translation_status" RENAME TO "TranslationStatus";
ALTER TABLE "translation_keys" ALTER COLUMN "status" SET DEFAULT 'published'::"TranslationStatus";
