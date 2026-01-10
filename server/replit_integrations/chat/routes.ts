import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // جلب المحادثات - تم استخدام المسار الموحدchats
  app.get("/api/chats", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // جلب محادثة مفردة برسائلها
  app.get("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Chat not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  // إنشاء محادثة جديدة - يدعم الآن x-user-id لحل مشكلة الإدخال
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      // استخراج المعرف من الهيدرز كما يرسله الكود الذي فحصته في المتصفح
      const userId = req.headers["x-user-id"] as string || "default_user";

      // تمرير الـ userId لضمان مطابقة الـ Schema (userId: text().notNull())
      const conversation = await chatStorage.createConversation(title || "محادثة جديدة", userId);
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // حذف محادثة
  app.delete("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  // إرسال رسالة والحصول على رد الذكاء الاصطناعي
  app.post("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      const { content } = req.body;

      // حفظ رسالة المستخدم
      await chatStorage.createMessage(chatId, "user", content);

      // جلب تاريخ المحادثة للسياق
      const messages = await chatStorage.getMessagesByConversation(chatId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // إعداد SSE للبث المباشر
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // استخدام الموديل gpt-4o لضمان استقرار الخدمة
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // حفظ رد المساعد
      await chatStorage.createMessage(chatId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
