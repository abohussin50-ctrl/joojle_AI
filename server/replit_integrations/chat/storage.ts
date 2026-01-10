import { db } from "../../db";
import { chats, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export const chatStorage = {
  async getAllConversations() {
    return db.select().from(chats).orderBy(desc(chats.createdAt));
  },

  async createConversation(title: string, userId: string) {
    const [chat] = await db.insert(chats).values({ 
      title, 
      userId 
    }).returning();
    return chat;
  },

  async getMessagesByConversation(chatId: number) {
    return db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  },

  async createMessage(chatId: number, role: string, content: string) {
    const [message] = await db.insert(messages).values({ chatId, role, content }).returning();
    return message;
  }
};
