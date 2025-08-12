import type { Connection } from "mongoose";

export async function up(conn: Connection): Promise<void> {
    await conn?.db?.collection('invoices').createIndex({ createdAt: 1 });
    await conn?.db?.collection('customers').createIndex({ email: 1 }, { unique: true });  
}

export async function down(conn: Connection): Promise<void> {
    try { await conn?.db?.collection('invoices').dropIndex({ createdAt: 1 } as any); } catch {}
    try { await conn?.db?.collection('customers').dropIndex('email_1'); } catch {}  
}
