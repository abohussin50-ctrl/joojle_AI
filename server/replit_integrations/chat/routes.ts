import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // 1. مسار جلب المحادثات (GET api/chats)
  app.get("/api/chats", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chats" });
    }
  });

  // 2. مسار إنشاء محادثة (POST api/chats)
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      // استخراج x-user-id لضمان القبول في قاعدة البيانات
      const userId = req.headers["x-user-id"] as string || "default_user";
      const conversation = await chatStorage.createConversation(title || "New Chat", userId);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Creation Error:", error);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });

  // 3. مسار الرسائل (POST api/chats/:id/messages)
  app.post("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
      const { content } = req.body;
      await chatStorage.createMessage(chatId, "user", content);

      const messages = await chatStorage.getMessagesByConversation(chatId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o", // تم التصحيح لضمان العمل
        messages: chatMessages,
        stream: true,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      await chatStorage.createMessage(chatId, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.status(500).end();
    }
  });
}
