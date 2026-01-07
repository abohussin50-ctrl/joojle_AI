import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { db } from "./db"; 
import { users } from "../shared/schema"; // تصحيح المسار هنا
import OpenAI from "openai";
import { eq } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const openai = new OpenAI({ 
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  const getUserId = (req: any): string | null => {
    const id = req.user?.id || req.headers["x-user-id"];
    return id ? String(id) : null;
  };

  const getUserNameFromHeader = (req: any): string | null => {
    const nameHeader = req.headers["x-user-name"] || req.headers["X-User-Name"];
    if (nameHeader) {
      try {
        return decodeURIComponent(nameHeader as string);
      } catch (e) {
        return nameHeader as string;
      }
    }
    return null;
  };

  // 1. قائمة المحادثات
  app.get(api.chats.list.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const chats = await storage.getChats(userId);
      res.json(chats);
    } catch (err) {
      res.status(500).json({ message: "Error fetching chats" });
    }
  });

  // 2. إنشاء محادثة
  app.post(api.chats.create.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat({ title: input.title, userId }); 
      res.status(201).json(chat);
    } catch (err) {
      res.status(500).json({ message: "Error creating chat" });
    }
  });

  // 3. حذف محادثة
  app.delete(api.chats.delete.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chatId = Number(req.params.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      await storage.deleteChat(chatId);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Error during deletion" });
    }
  });

  // 4. جلب محادثة ورسائلها
  app.get(api.chats.get.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const chat = await storage.getChat(id);
      if (!chat) return res.status(404).json({ message: "Chat not found" });
      const messages = await storage.getMessages(id);
      res.json({ chat, messages });
    } catch (err) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // 5. إضافة رسالة (هنا يتم إصلاح اختفاء الرسائل)
  app.post(api.chats.addMessage.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chatId = Number(req.params.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { content, imageUrl } = req.body;
      const userName = getUserNameFromHeader(req) || "صديقي";

      // حفظ رسالة المستخدم
      await storage.createMessage({ 
        chatId, 
        role: "user", 
        content: content || "", 
        imageUrl: imageUrl || null 
      });

      // جلب التاريخ للـ AI
      const history = await storage.getMessages(chatId);
      const messagesForAI = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are Joojle AI. Talking to: ${userName}` }, 
          ...messagesForAI
        ],
      });

      const aiMessage = await storage.createMessage({
        chatId,
        role: "assistant",
        content: aiResponse.choices[0].message.content || "",
        imageUrl: null
      });

      // إرسال الرد النهائي
      res.status(201).json(aiMessage);
    } catch (error) {
      console.error("Critical AI Error:", error);
      res.status(500).json({ message: "AI Error" });
    }
  });

  return httpServer;
}