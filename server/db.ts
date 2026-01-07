import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * دالة الإصلاح التلقائي لقاعدة البيانات
 * تقوم بالتأكد من وجود عمود user_id وتصحيح نوعه
 */
async function ensureSchemaSync() {
  try {
    log("Checking database schema integrity...", "database");

    // 1. إضافة العمود إذا لم يكن موجوداً
    await pool.query(`
      ALTER TABLE chats 
      ADD COLUMN IF NOT EXISTS user_id TEXT;
    `);

    // 2. التأكد من أن نوع العمود هو TEXT (لأن معرفات Supabase ليست أرقاماً)
    await pool.query(`
      ALTER TABLE chats 
      ALTER COLUMN user_id TYPE TEXT;
    `);

    log("Database schema is synced and secured.", "database");
  } catch (err) {
    console.error("Database sync failed:", err);
  }
}

// تشغيل الإصلاح فوراً عند بدء السيرفر
ensureSchemaSync();

// دالة مساعدة لتسجيل الرسائل في التيرمينال (اختيارية)
function log(message: string, source = "db") {
  const formattedTime = new Date().toLocaleTimeString();
  console.log(`${formattedTime} [${source}] ${message}`);
}