-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "order_status" TEXT[] DEFAULT ARRAY['Fullfilled', 'Pending', 'Cancelled']::TEXT[];

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shipping_fee" INTEGER NOT NULL DEFAULT 0;
