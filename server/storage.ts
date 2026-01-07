import { db } from "./db";
import { chats, messages, users, type Chat, type Message, type InsertChat, type InsertMessage, type User, type InsertUser } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>; // أضفنا هذه الدالة
  getChats(userId: number | string): Promise<Chat[]>; 
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: { title: string, userId: any }): Promise<Chat>;
  deleteChat(id: number): Promise<void>;
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    // نستخدم parseInt للتأكد من أننا نبحث برقم صحيح
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // دالة لإنشاء مستخدم جديد إذا لم يكن موجوداً
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getChats(userId: number | string): Promise<Chat[]> {
    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, String(userId)))
      .orderBy(desc(chats.createdAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(chat: { title: string, userId: any }): Promise<Chat> {
    const [newChat] = await db.insert(chats).values({
      title: chat.title,
      userId: String(chat.userId)
    }).returning();
    return newChat;
  }

  async deleteChat(id: number): Promise<void> {
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