import { db } from "../../db";
import { chats, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<typeof chats.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof chats.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof chats.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(chatId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(chatId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  },

  async getAllConversations() {
    return db.select().from(chats).orderBy(desc(chats.createdAt));
  },

  async createConversation(title: string) {
    // تم إضافة user_id بقيمة افتراضية لأن الـ Schema تطلبه كـ Not Null
    const [chat] = await db.insert(chats).values({ 
      title, 
      userId: "default_user" 
    }).returning();
    return chat;
  },

  async deleteConversation(id: number) {
    await db.delete(messages).where(eq(messages.chatId, id));
    await db.delete(chats).where(eq(chats.id, id));
  },

  async getMessagesByConversation(chatId: number) {
    return db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
  },

  async createMessage(chatId: number, role: string, content: string) {
    const [message] = await db.insert(messages).values({ chatId, role, content }).returning();
    return message;
  },
};
