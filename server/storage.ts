import { db } from "./db";
import { chats, messages, type Chat, type Message, type InsertChat, type InsertMessage } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getChats(): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  deleteChat(id: number): Promise<void>;
  
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getChats(): Promise<Chat[]> {
    return await db.select().from(chats).orderBy(desc(chats.createdAt));
  }

  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    return newChat;
  }

  async deleteChat(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.chatId, id));
    await db.delete(chats).where(eq(chats.id, id));
  }

  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
