-- CreateEnum
CREATE TYPE "FlowScope" AS ENUM ('ALL_POSTS', 'SPECIFIC_POST');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('ANY', 'KEYWORD');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "username" TEXT,
    "accessToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scope" "FlowScope" NOT NULL DEFAULT 'ALL_POSTS',
    "mediaId" TEXT,
    "matchType" "MatchType" NOT NULL DEFAULT 'ANY',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicReplies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dmMessage" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentEvent" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "mediaId" TEXT,
    "fromUserId" TEXT,
    "fromUsername" TEXT,
    "text" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "commentId" TEXT,
    "flowId" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_igUserId_key" ON "Account"("igUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentEvent_commentId_key" ON "CommentEvent"("commentId");

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
