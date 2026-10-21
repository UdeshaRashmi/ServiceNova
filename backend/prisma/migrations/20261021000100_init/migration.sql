-- SQLite stores enums as TEXT. CHECK constraints also protect direct SQL writes.
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('USER', 'ADMIN')),
    "sessionVersion" INTEGER NOT NULL DEFAULT 0 CHECK ("sessionVersion" >= 0),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL CHECK ("category" IN ('TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER')),
    "priority" TEXT NOT NULL CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH')),
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')),
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_id_idx" ON "User"("createdAt", "id");
CREATE INDEX "ServiceRequest_userId_createdAt_id_idx" ON "ServiceRequest"("userId", "createdAt", "id");
CREATE INDEX "ServiceRequest_status_createdAt_id_idx" ON "ServiceRequest"("status", "createdAt", "id");
CREATE INDEX "ServiceRequest_category_createdAt_id_idx" ON "ServiceRequest"("category", "createdAt", "id");
CREATE INDEX "ServiceRequest_priority_createdAt_id_idx" ON "ServiceRequest"("priority", "createdAt", "id");
CREATE INDEX "ServiceRequest_createdAt_id_idx" ON "ServiceRequest"("createdAt", "id");
