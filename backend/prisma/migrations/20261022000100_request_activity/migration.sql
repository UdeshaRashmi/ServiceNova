CREATE TABLE "RequestActivity" (
 "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
 "requestId" TEXT NOT NULL,
 "actorId" TEXT,
 "type" TEXT NOT NULL CHECK ("type" IN ('CREATED','UPDATED','STATUS_CHANGED','TRACKING_STARTED')),
 "fromStatus" TEXT CHECK ("fromStatus" IN ('PENDING','IN_PROGRESS','RESOLVED','CANCELLED')),
 "toStatus" TEXT CHECK ("toStatus" IN ('PENDING','IN_PROGRESS','RESOLVED','CANCELLED')),
 "changedFields" TEXT,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "RequestActivity_requestId_id_idx" ON "RequestActivity"("requestId", "id");
INSERT INTO "RequestActivity" ("requestId", "type", "toStatus")
 SELECT "id", 'TRACKING_STARTED', "status" FROM "ServiceRequest";
