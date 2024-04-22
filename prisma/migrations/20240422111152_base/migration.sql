-- CreateTable
CREATE TABLE "Session" (
    "id" BIGSERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "is_bot" BOOLEAN NOT NULL,
    "telegram_chat_id" BIGINT NOT NULL,
    "telegram_language_code" TEXT,
    "is_premium" BOOLEAN NOT NULL,
    "added_to_attachment_menu" BOOLEAN NOT NULL,
    "is_personal_chat_open" BOOLEAN NOT NULL,
    "language" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "username" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_forum" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_key_key" ON "Session"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegram_chat_id_key" ON "User"("telegram_chat_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_telegram_chat_id_fkey" FOREIGN KEY ("telegram_chat_id") REFERENCES "TelegramChat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
