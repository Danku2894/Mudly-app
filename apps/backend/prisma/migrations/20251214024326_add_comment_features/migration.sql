-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "isToxic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "toxicityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "comment_reactions" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "authorId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_reactions_commentId_idx" ON "comment_reactions"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_reactions_authorId_commentId_key" ON "comment_reactions"("authorId", "commentId");

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
