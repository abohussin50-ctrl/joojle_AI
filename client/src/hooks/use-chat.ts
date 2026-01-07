import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";
import { useAuth } from "./use-auth";

/**
 * دالة استخراج الاسم من بيانات Supabase بشكل آمن
 */
const getUserDisplayName = (user: any) => {
  if (!user) return "User";
  return (
    user.user_metadata?.full_name || 
    user.user_metadata?.name || 
    user.email?.split('@')[0] || 
    "User"
  );
};

// 1. جلب قائمة المحادثات الخاصة بالمستخدم فقط
export function useChats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [api.chats.list.path, user?.id], // ربط الكاش بـ ID المستخدم
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(api.chats.list.path, { 
        headers: { 
          "x-user-id": user.id,
          "x-user-name": encodeURIComponent(getUserDisplayName(user))
        },
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
      const res = await fetch(api.chats.create.path, {
        method: api.chats.create.method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-user-name": encodeURIComponent(getUserDisplayName(user))
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create chat");
      return api.chats.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      // تحديث قائمة المحادثات فوراً
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path, user?.id] });
      // الانتقال للمحادثة الجديدة
      setLocation(`/chat/${data.id}`);
    },
  });
}

// 3. حذف محادثة
export function useDeleteChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.chats.delete.path, { id });
      const res = await fetch(url, { 
        method: api.chats.delete.method,
        headers: { 
          "x-user-id": user?.id || "",
          "x-user-name": encodeURIComponent(getUserDisplayName(user))
        },
        credentials: "include" 
      });

      if (!res.ok) throw new Error("Failed to delete chat");
    },
    onSuccess: () => {
      // تحديث القائمة بعد الحذف
      queryClient.invalidateQueries({ queryKey: [api.chats.list.path, user?.id] });
    },
  });
}

// 4. جلب محادثة واحدة (مع تأمين الخصوصية)
export function useChat(id: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["chat", id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;
      const url = buildUrl(api.chats.get.path, { id });
      const res = await fetch(url, { 
        headers: { 
          "x-user-id": user.id,
          "x-user-name": encodeURIComponent(getUserDisplayName(user))
        },
        credentials: "include" 
      });

      if (res.status === 403) throw new Error("Unauthorized");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch chat");

      return api.chats.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !!user,
    retry: false, 
  });
}

// 5. إرسال رسالة (مع التحديث التلقائي للواجهة)
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
          "x-user-id": user?.id || "",
          "x-user-name": encodeURIComponent(getUserDisplayName(user)) 
        },
        body: JSON.stringify({ content, imageUrl }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to send message");
      return api.chats.addMessage.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // تحديث كاش المحادثة الحالية لإظهار رد الـ AI
      queryClient.invalidateQueries({ queryKey: ["chat", variables.chatId, user?.id] });
    },
  });
}