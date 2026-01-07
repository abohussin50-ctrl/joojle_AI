import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 1. إضافة جدول المستخدمين - هذا ضروري جداً للتعرف على الاسم
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // ربط المحادثة بمعرف المستخدم
  userId: text("user_id").notNull(), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(), // 'user' or 'system' or 'assistant'
  content: text("content").notNull(),
  imageUrl: text("image_url"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. تصدير أنواع الإدخال (Insert Schemas)
export const insertUserSchema = createInsertSchema(users);

export const insertChatSchema = createInsertSchema(chats).omit({ 
  id: true, 
  createdAt: true,
  userId: true 
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true 
});

// 3. تصدير الأنواع (Types) - هذا سيحذف الخطوط الحمراء في storage.ts
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;