/*
  Warnings:

  - You are about to drop the column `shipping_fee` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `warehouse1` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `warehouse2` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `warehouse3` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_product_id_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "shipping_fee",
DROP COLUMN "warehouse1",
DROP COLUMN "warehouse2",
DROP COLUMN "warehouse3",
ADD COLUMN     "address" TEXT NOT NULL;

-- DropTable
DROP TABLE "Order";
