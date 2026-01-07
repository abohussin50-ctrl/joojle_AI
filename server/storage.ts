import { db } from "./db";
import { 
  chats, 
  messages, 
  users, 
  type Chat, 
  type Message, 
  type InsertChat, 
  type InsertMessage, 
  type User, 
  type InsertUser 
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // تعديل الواجهة لتقبل userId في جلب القائمة
  getChats(userId: string): Promise<Chat[]>; 
  getChat(id: number): Promise<Chat | undefined>;
  // تعديل الواجهة لفرض وجود userId عند إنشاء محادثة
  createChat(chat: { title: string; userId: string }): Promise<Chat>;
  deleteChat(id: number): Promise<void>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // ✅ جلب المحادثات الخاصة بالمستخدم الحالي فقط
  async getChats(userId: string): Promise<Chat[]> {
    if (!userId) return [];
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, String(userId).trim()))
      .orderBy(desc(chats.createdAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    if (isNaN(id)) return undefined;
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  // ✅ ربط المحادثة الجديدة بـ userId بشكل إجباري
  async createChat(chat: { title: string; userId: string }): Promise<Chat> {
    if (!chat.userId) throw new Error("User ID is required to create a chat");
    const [newChat] = await db
      .insert(chats)
      .values({
        title: chat.title,
        userId: String(chat.userId).trim(),
      })
      .returning();
    return newChat;
  }

  async deleteChat(id: number): Promise<void> {
    // ملاحظة: يُفضل دائماً التحقق من الملكية في routes.ts قبل الاستدعاء هنا
    await db.delete(chats).where(eq(chats.id, id));
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();