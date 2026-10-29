-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Admin',
    "initials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boats" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "reg" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'Vessel',
    "icon" TEXT NOT NULL DEFAULT '⛵',
    "color" TEXT NOT NULL DEFAULT 's',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "boatId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "expiryDate" DATE NOT NULL,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileData" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,
    "daysThreshold" INTEGER NOT NULL,
    "triggerDate" DATE NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "userId" TEXT NOT NULL,
    "schedule60" BOOLEAN NOT NULL DEFAULT true,
    "schedule30" BOOLEAN NOT NULL DEFAULT true,
    "schedule14" BOOLEAN NOT NULL DEFAULT true,
    "schedule7" BOOLEAN NOT NULL DEFAULT true,
    "channelPush" BOOLEAN NOT NULL DEFAULT true,
    "channelEmail" BOOLEAN NOT NULL DEFAULT true,
    "channelSms" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "boats_userId_idx" ON "boats"("userId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_boatId_idx" ON "documents"("boatId");

-- CreateIndex
CREATE INDEX "reminders_userId_sent_idx" ON "reminders"("userId", "sent");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_documentId_daysThreshold_key" ON "reminders"("documentId", "daysThreshold");

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
