/*
  Warnings:

  - You are about to drop the column `seller_id` on the `Order` table. All the data in the column will be lost.
  - Added the required column `buyer_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_seller_id_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "seller_id",
ADD COLUMN     "buyer_id" INTEGER NOT NULL,
ALTER COLUMN "order_status" SET DEFAULT ARRAY['Pending', 'Fullfilled', 'Cancelled']::TEXT[];

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "shipping_fee" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
