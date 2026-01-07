import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";

// 1. جلب قائمة المحادثات
export function useChats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [api.chats.list.path, user?.id],
    queryFn: async () => {
      const res = await fetch(api.chats.list.path, { 
        headers: { "x-user-id": user?.id || "" },
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch chats");
      return api.chats.list.responses[200].parse(await res.json());
    },
    enabled: !!user,
  });
}

// 2. إنشاء محادثة جديدة
export function useCreateChat() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (title: string) => {
      const payload = { title: title.trim() || "New Chat" };
      const validated = api.chats.create.input.parse(payload);

      const res = await fetch(api.chats.create.path, {
        method: api.chats.create.method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.id || "" 
        },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create chat");
      }
      return api.chats.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
      setLocation(`/chat/${data.id}`);
    },
  });
}

// 3. حذف محادثة (هذا هو الجزء الذي كان ناقصاً وتسبب بالخطأ)
export function useDeleteChat() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chats.delete.path, { id });
      const res = await fetch(url, { 
        method: api.chats.delete.method,
        headers: { "x-user-id": user?.id || "" },
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    }
  });
}

// 4. جلب محادثة واحدة ورسائلها
export function useChat(id: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [api.chats.get.path, id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;
      const url = buildUrl(api.chats.get.path, { id });
      const res = await fetch(url, { 
        headers: { "x-user-id": user.id },
        credentials: "include" 
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch chat");
      return api.chats.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !!user,
  });
}

// 5. إرسال رسالة
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ chatId, content, imageUrl }: { chatId: number; content: string; imageUrl?: string }) => {
      const url = buildUrl(api.chats.addMessage.path, { id: chatId });
      const res = await fetch(url, {
        method: api.chats.addMessage.method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.id || "" 
        },
        body: JSON.stringify({ content, imageUrl }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.chats.addMessage.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.chats.get.path, variables.chatId] });
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
    },
  });
}