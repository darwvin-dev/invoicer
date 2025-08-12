import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CustomerModel, type CustomerEntity } from '../modules/customers/customer.model.js';
import { InvoiceModel } from '../modules/invoices/invoice.model.js';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found');
    process.exit(1);
  }

  console.log('Connecting to Mongo...');
  await mongoose.connect(uri);
  console.log('Connected to mongo');

  try {
    console.log('Creating customers');
    const passwordHash = await bcrypt.hash('test1234', 12);

    const created = await CustomerModel.insertMany([
      { name: 'Darwvin', email: 'darwvin@hotmail.com', passwordHash },
      { name: 'Test',    email: 'test@test.com',       passwordHash },
    ]); 

    const darwvin: CustomerEntity = created[0]!;
    const test:    CustomerEntity = created[1]!;

    console.log('Creating invoices...');
    const now = new Date();
    const days = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

    const invoices = [
      {
        customerId: String(darwvin._id),
        createdAt: days(1),
        currency: 'EUR',
        items: [
          { sku: 'SKU-AAA', quantity: 2, unitPrice: 10.5 },
          { sku: 'SKU-BBB', quantity: 1, unitPrice: 5.0 },
        ],
      },
      {
        customerId: String(test._id),
        createdAt: now,
        currency: 'EUR',
        items: [{ sku: 'SKU-AAA', quantity: 3, unitPrice: 10.5 }],
      },
    ];

    await InvoiceModel.insertMany(invoices);

    console.log('Seed completed.');
    process.exitCode = 0;
  } catch (err) {
    console.error('Error seed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
