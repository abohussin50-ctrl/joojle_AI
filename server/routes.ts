import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize OpenAI client
  const openai = new OpenAI({ 
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  // List chats
  app.get(api.chats.list.path, async (req, res) => {
    const chats = await storage.getChats();
    res.json(chats);
  });

  // Create chat
  app.post(api.chats.create.path, async (req, res) => {
    try {
      const input = api.chats.create.input.parse(req.body);
      const chat = await storage.createChat(input);
      res.status(201).json(chat);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Get chat details (messages)
  app.get(api.chats.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const chat = await storage.getChat(id);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    const messages = await storage.getMessages(id);
    res.json({ chat, messages });
  });

  // Delete chat
  app.delete(api.chats.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const chat = await storage.getChat(id);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    await storage.deleteChat(id);
    res.status(204).send();
  });

  // Add message & get AI response
  app.post(api.chats.addMessage.path, async (req, res) => {
    const id = Number(req.params.id);
    const chat = await storage.getChat(id);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const { content } = req.body;
    
    // 1. Save user message
    await storage.createMessage({
      chatId: id,
      role: "user",
      content: content
    });

    // 2. Get AI response
    try {
      // Fetch recent history for context (last 10 messages)
      const history = await storage.getMessages(id);
      const messages = history.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are Joojle AI, a helpful and intelligent AI assistant. You are similar to Gemini." },
          ...messages
        ],
      });

      const aiContent = response.choices[0].message.content || "I couldn't generate a response.";

      // 3. Save AI message
      const aiMessage = await storage.createMessage({
        chatId: id,
        role: "assistant",
        content: aiContent
      });

      res.status(201).json(aiMessage);
    } catch (error: any) {
      console.error("OpenAI Error:", error);
      res.status(500).json({ message: "Failed to generate AI response: " + error.message });
    }
  });

  return httpServer;
}
