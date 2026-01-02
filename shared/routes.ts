import { z } from "zod";
import { insertChatSchema, insertMessageSchema, chats, messages } from "./schema";

export const api = {
  chats: {
    list: {
      method: "GET" as const,
      path: "/api/chats",
      responses: {
        200: z.array(z.custom<typeof chats.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/chats",
      input: insertChatSchema,
      responses: {
        201: z.custom<typeof chats.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/chats/:id",
      responses: {
        200: z.object({
          chat: z.custom<typeof chats.$inferSelect>(),
          messages: z.array(z.custom<typeof messages.$inferSelect>()),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/chats/:id",
      responses: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
    addMessage: {
      method: "POST" as const,
      path: "/api/chats/:id/messages",
      input: z.object({
        content: z.string(),
      }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(), // returns the assistant response
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
