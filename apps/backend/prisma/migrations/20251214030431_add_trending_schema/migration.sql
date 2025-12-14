-- CreateTable
CREATE TABLE "trending_topics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HashtagToPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "trending_topics_name_key" ON "trending_topics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_name_key" ON "hashtags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_HashtagToPost_AB_unique" ON "_HashtagToPost"("A", "B");

-- CreateIndex
CREATE INDEX "_HashtagToPost_B_index" ON "_HashtagToPost"("B");

-- AddForeignKey
ALTER TABLE "_HashtagToPost" ADD CONSTRAINT "_HashtagToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HashtagToPost" ADD CONSTRAINT "_HashtagToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
