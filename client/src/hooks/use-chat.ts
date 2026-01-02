import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";

// ============================================
// CHAT LIST HOOKS
// ============================================

export function useChats() {
  return useQuery({
    queryKey: [api.chats.list.path],
    queryFn: async () => {
      const res = await fetch(api.chats.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch chats");
      return api.chats.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (title: string) => {
      // Use "New Chat" if title is empty or undefined
      const payload = { title: title.trim() || "New Chat" };
      
      const validated = api.chats.create.input.parse(payload);
      
      const res = await fetch(api.chats.create.path, {
        method: api.chats.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid input");
        }
        throw new Error("Failed to create chat");
      }
      return api.chats.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
      // Navigate to the new chat
      setLocation(`/chat/${data.id}`);
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chats.delete.path, { id });
      const res = await fetch(url, { 
        method: api.chats.delete.method,
        credentials: "include" 
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Chat not found");
        throw new Error("Failed to delete chat");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] });
      setLocation("/");
    },
  });
}

// ============================================
// SINGLE CHAT & MESSAGING HOOKS
// ============================================

export function useChat(id: number | null) {
  return useQuery({
    queryKey: [api.chats.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.chats.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null; // Handle 404 gracefully
      if (!res.ok) throw new Error("Failed to fetch chat");
      
      return api.chats.get.responses[200].parse(await res.json());
    },
    enabled: !!id, // Only fetch if ID exists
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, content, imageUrl }: { chatId: number; content: string; imageUrl?: string }) => {
      const url = buildUrl(api.chats.addMessage.path, { id: chatId });
      const res = await fetch(url, {
        method: api.chats.addMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Chat not found");
        throw new Error("Failed to send message");
      }
      
      return api.chats.addMessage.responses[201].parse(await res.json());
    },
    onMutate: async ({ chatId, content, imageUrl }) => {
      // Optimistic Update: Immediately show user message
      await queryClient.cancelQueries({ queryKey: [api.chats.get.path, chatId] });
      const previousData = queryClient.getQueryData([api.chats.get.path, chatId]);

      queryClient.setQueryData([api.chats.get.path, chatId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: -1, // Temporary ID
              chatId,
              role: "user",
              content,
              imageUrl: imageUrl || null,
              createdAt: new Date(),
            },
          ],
        };
      });

      return { previousData };
    },
    onError: (err, newTodo, context: any) => {
      queryClient.setQueryData([api.chats.get.path, newTodo.chatId], context.previousData);
    },
    onSuccess: (data, variables) => {
      // Invalidate to get the AI response (since the endpoint returns it, we could also update manually)
      // But standard invalidation ensures full sync
      queryClient.invalidateQueries({ queryKey: [api.chats.get.path, variables.chatId] });
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path] }); // Update timestamps/previews
    },
  });
}
