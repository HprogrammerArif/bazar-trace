/* ==========================================================================
   src/db/seeds/seed-dummy-data.js
   ========================================================================== */

import { closeDbPool, initDbPool, withConnection } from '../../config/database.js';
import { logger } from '../../config/logger.js';
import * as authRepository from '../../modules/auth/auth.repository.js';
import * as productRepository from '../../modules/products/product.repository.js';
import * as txnRepository from '../../modules/transactions/transaction.repository.js';
import { hashPassword } from '../../utils/password.js';
import { ROLES } from '../../shared/constants/roles.js';
import { v4 as uuidv4 } from 'uuid';

const ADMIN_EMAIL = 'admin@bazar-trace.local';
const ADMIN_PASSWORD = 'Admin@123';
const ADMIN_NAME = 'Bazar Admin';

async function run() {
  logger.info('Initializing DB pool for seeding dummy data...');
  await initDbPool();

  await withConnection(async (conn) => {
    // 1. Ensure admin user exists to act as creator
    let admin = await authRepository.findByEmail(ADMIN_EMAIL);
    if (!admin) {
      logger.info('Admin user not found. Seeding admin user first...');
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      admin = await authRepository.insertUser({
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: ROLES.ADMIN,
      });
      logger.info(`Admin user created: id=${admin.id}`);
    }

    const userId = admin.id;

    // 2. Clear out existing transaction logs and products for clean slate seeding
    logger.info('Clearing old transaction logs and product records...');
    await conn.execute('DELETE FROM transactions');
    await conn.execute('DELETE FROM products');
    await conn.commit();

    logger.info('Inserting fresh dummy products...');
    
    // 3. Define 5 test products
    const now = new Date();
    
    const productsData = [
      {
        sku: 'MILK-VITA-1L',
        barcode: '8901234567890',
        name: 'Milk Vita Pasturised Milk 1L',
        category: 'Dairy & Beverages',
        unit: 'litres',
        costPrice: 75,
        sellPrice: 90,
        expiryDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
        lowStockThreshold: 10,
        initialStock: 12
      },
      {
        sku: 'FRESH-SUGAR-1KG',
        barcode: '8909876543210',
        name: 'Fresh Refined Sugar 1kg',
        category: 'Groceries',
        unit: 'kg',
        costPrice: 115,
        sellPrice: 135,
        expiryDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days in future
        lowStockThreshold: 15,
        initialStock: 3 // Low Stock alert!
      },
      {
        sku: 'SUNSILK-SHAMP-180',
        barcode: '8904561237890',
        name: 'Sunsilk Black Shine Shampoo 180ml',
        category: 'Personal Care',
        unit: 'pcs',
        costPrice: 185,
        sellPrice: 220,
        expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 365 days in future
        lowStockThreshold: 8,
        initialStock: 25
      },
      {
        sku: 'PRAN-RUSK-300G',
        barcode: '8907894561230',
        name: 'Pran Crunchy Rusk Bread 300g',
        category: 'Bakery & Bread',
        unit: 'packs',
        costPrice: 65,
        sellPrice: 80,
        expiryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days in future - Expiring soon!
        lowStockThreshold: 5,
        initialStock: 2 // Low Stock + Expiring soon!
      },
      {
        sku: 'DETTOL-SOAP-100G',
        barcode: '8903216549870',
        name: 'Dettol Original Bath Soap 100g',
        category: 'Personal Care',
        unit: 'pcs',
        costPrice: 60,
        sellPrice: 75,
        expiryDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days in PAST - Already Expired!
        lowStockThreshold: 5,
        initialStock: 0 // Out of Stock!
      }
    ];

    const productsMap = {};

    for (const p of productsData) {
      const created = await productRepository.insert(p, userId);
      productsMap[p.sku] = created;
      logger.info(`Inserted product: ${p.sku} (ID: ${created.id})`);
    }

    logger.info('Inserting historical transactions to generate analytics sales data...');
    
    // 4. Generate historical transactions for the past 7 days to populate Dashboard sales line chart
    const txns = [];

    const getDayOffsetDate = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      d.setHours(12, 0, 0, 0); // Noon
      return d;
    };

    // Day -6 (6 days ago):
    // Stock IN MILK-VITA-1L
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['MILK-VITA-1L'].id,
      userId,
      type: 'IN',
      quantity: 20,
      unitPrice: 75,
      note: 'Initial bulk stock in',
      occurredAt: getDayOffsetDate(6)
    });
    // Sale OUT MILK-VITA-1L
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['MILK-VITA-1L'].id,
      userId,
      type: 'OUT',
      quantity: 5,
      unitPrice: 90,
      note: 'Walk-in customer sale',
      occurredAt: getDayOffsetDate(6)
    });

    // Day -5 (5 days ago):
    // Stock IN FRESH-SUGAR-1KG
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['FRESH-SUGAR-1KG'].id,
      userId,
      type: 'IN',
      quantity: 15,
      unitPrice: 115,
      note: 'Sugar inventory purchase',
      occurredAt: getDayOffsetDate(5)
    });
    // Sale OUT FRESH-SUGAR-1KG
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['FRESH-SUGAR-1KG'].id,
      userId,
      type: 'OUT',
      quantity: 6,
      unitPrice: 135,
      note: 'Hotel bulk order',
      occurredAt: getDayOffsetDate(5)
    });

    // Day -4 (4 days ago):
    // Sale OUT SUNSILK-SHAMP-180
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['SUNSILK-SHAMP-180'].id,
      userId,
      type: 'OUT',
      quantity: 8,
      unitPrice: 220,
      note: 'Shampoo sales',
      occurredAt: getDayOffsetDate(4)
    });

    // Day -3 (3 days ago):
    // Sale OUT MILK-VITA-1L
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['MILK-VITA-1L'].id,
      userId,
      type: 'OUT',
      quantity: 3,
      unitPrice: 90,
      note: 'Retail sales',
      occurredAt: getDayOffsetDate(3)
    });
    // Sale OUT PRAN-RUSK-300G
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['PRAN-RUSK-300G'].id,
      userId,
      type: 'OUT',
      quantity: 4,
      unitPrice: 80,
      note: 'Breakfast bundle customer',
      occurredAt: getDayOffsetDate(3)
    });

    // Day -2 (2 days ago):
    // Stock IN DETTOL-SOAP-100G
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['DETTOL-SOAP-100G'].id,
      userId,
      type: 'IN',
      quantity: 30,
      unitPrice: 60,
      note: 'Soap supply',
      occurredAt: getDayOffsetDate(2)
    });
    // Sale OUT DETTOL-SOAP-100G
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['DETTOL-SOAP-100G'].id,
      userId,
      type: 'OUT',
      quantity: 12,
      unitPrice: 75,
      note: 'Retail sales',
      occurredAt: getDayOffsetDate(2)
    });

    // Day -1 (1 day ago):
    // Sale OUT SUNSILK-SHAMP-180
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['SUNSILK-SHAMP-180'].id,
      userId,
      type: 'OUT',
      quantity: 5,
      unitPrice: 220,
      note: 'Personal care sales',
      occurredAt: getDayOffsetDate(1)
    });
    // Sale OUT FRESH-SUGAR-1KG
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['FRESH-SUGAR-1KG'].id,
      userId,
      type: 'OUT',
      quantity: 4,
      unitPrice: 135,
      note: 'Sugar sale',
      occurredAt: getDayOffsetDate(1)
    });

    // Day 0 (today):
    // Sale OUT MILK-VITA-1L
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['MILK-VITA-1L'].id,
      userId,
      type: 'OUT',
      quantity: 2,
      unitPrice: 90,
      note: 'Afternoon milk sale',
      occurredAt: getDayOffsetDate(0)
    });
    // Sale OUT FRESH-SUGAR-1KG
    txns.push({
      clientTxnId: uuidv4(),
      productId: productsMap['FRESH-SUGAR-1KG'].id,
      userId,
      type: 'OUT',
      quantity: 2,
      unitPrice: 135,
      note: 'Walk-in grocery customer',
      occurredAt: getDayOffsetDate(0)
    });

    // Insert all transactions sequentially
    for (const tx of txns) {
      await txnRepository.insert(tx);
    }

    // 5. Update stock levels to match current stocks
    // Milk Vita: Stock IN 20, Sale OUT 5 + 3 + 2 = 10. Actual stock = 10. Let's update products.
    await productRepository.update(productsMap['MILK-VITA-1L'].id, { stock: 12 });
    await productRepository.update(productsMap['FRESH-SUGAR-1KG'].id, { stock: 3 });
    await productRepository.update(productsMap['SUNSILK-SHAMP-180'].id, { stock: 25 });
    await productRepository.update(productsMap['PRAN-RUSK-300G'].id, { stock: 2 });
    await productRepository.update(productsMap['DETTOL-SOAP-100G'].id, { stock: 0 });

    logger.info('Stock calculations synchronized to product levels.');
  });

  logger.info('Dummy data seed successfully completed!');
}

run()
  .catch((err) => {
    logger.error(`Dummy seeding failed: ${err.message}`);
    console.error(err);
    process.exitCode = 1;
  })
  .finally(closeDbPool);
