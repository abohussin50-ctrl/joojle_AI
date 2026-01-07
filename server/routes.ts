import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import OpenAI from "openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const openai = new OpenAI({ 
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  // دالة موحدة لجلب الـ ID وتحويله لرقم لضمان التوافق مع DatabaseStorage.getUser
  const getUserId = (req: any): number | null => {
    const id = req.user?.id || req.headers["x-user-id"];
    return id ? Number(id) : null;
  };

  // --- 1. جلب قائمة المحادثات ---
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

  // --- 2. إنشاء محادثة جديدة ---
  app.post(api.chats.create.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat({ 
        title: input.title, 
        userId: String(userId) // نحوله لنص ليتوافق مع حقل user_id في جدول chats
      }); 
      res.status(201).json(chat);
    } catch (err) {
      res.status(500).json({ message: "Error creating chat" });
    }
  });

  // --- 3. حذف محادثة ---
  app.delete(api.chats.delete.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chatId = Number(req.params.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const chat = await storage.getChat(chatId);
      if (!chat) return res.status(404).json({ message: "Chat not found" });

      if (String(chat.userId) !== String(userId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteChat(chatId);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Error during deletion" });
    }
  });

  // --- 4. جلب تفاصيل محادثة ورسائلها ---
  app.get(api.chats.get.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = Number(req.params.id);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const chat = await storage.getChat(id);
      if (!chat || String(chat.userId) !== String(userId)) { 
        return res.status(404).json({ message: "Chat not found" });
      }

      const messages = await storage.getMessages(id);
      res.json({ chat, messages });
    } catch (err) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // --- 5. إضافة رسالة ومعالجة رد الذكاء الاصطناعي بالهوية ---
  app.post(api.chats.addMessage.path, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const chatId = Number(req.params.id);

      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const chat = await storage.getChat(chatId);
      if (!chat || String(chat.userId) !== String(userId)) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const { content, imageUrl } = req.body;

      // جلب بيانات المستخدم الفعلية من جدول users باستخدام المعرف الرقمي
      const currentUser = await storage.getUser(userId);
      const userName = currentUser?.username || "صديقي";

      // حفظ رسالة المستخدم في قاعدة البيانات
      await storage.createMessage({ 
        chatId: chatId, 
        role: "user", 
        content: content || (imageUrl ? "Analyze this image" : ""), 
        imageUrl: imageUrl || null 
      });

      // جلب تاريخ الرسائل لتحويلها لتنسيق OpenAI
      const history = await storage.getMessages(chatId);
      const messagesForAI = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      // استدعاء OpenAI مع حقن اسم المستخدم في رسالة النظام (System Prompt)
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are Joojle AI. You are talking to ${userName}. If the user asks for their name or who they are, tell them their name is "${userName}". Always be helpful and polite.` 
          }, 
          ...messagesForAI
        ],
      });

      // حفظ رد الذكاء الاصطناعي في قاعدة البيانات
      const aiMessage = await storage.createMessage({
        chatId: chatId,
        role: "assistant",
        content: aiResponse.choices[0].message.content || "",
        imageUrl: null
      });

      res.status(201).json(aiMessage);
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ message: "AI Error" });
    }
  });

  return httpServer;
}