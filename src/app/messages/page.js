"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const initMessages = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await loadConversations(user.id);

      const targetUserId = searchParams.get("userId");
      if (targetUserId) {
        await startConversationWithUser(user.id, targetUserId);
      }

      setLoading(false);
    };

    initMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation.id);
      const unsubscribe = subscribeToMessages(selectedConversation.id);
      return unsubscribe;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          user1:user1_id (id, full_name, profile_photo),
          user2:user2_id (id, full_name, profile_photo)
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const conversationsWithOtherUser = data.map((conv) => ({
        ...conv,
        otherUser: conv.user1_id === userId ? conv.user2 : conv.user1,
      }));

      setConversations(conversationsWithOtherUser);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const startConversationWithUser = async (currentUserId, otherUserId) => {
    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        current_user_id: currentUserId,
        other_user_id: otherUserId,
      });

      if (error) throw error;

      const { data: convData } = await supabase
        .from("conversations")
        .select(
          `
          *,
          user1:user1_id (id, full_name, profile_photo),
          user2:user2_id (id, full_name, profile_photo)
        `
        )
        .eq("id", data)
        .single();

      if (convData) {
        const conv = {
          ...convData,
          otherUser:
            convData.user1_id === currentUserId
              ? convData.user2
              : convData.user1,
        };
        setSelectedConversation(conv);

        setConversations((prev) => {
          const exists = prev.find((c) => c.id === conv.id);
          if (exists) return prev;
          return [conv, ...prev];
        });
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:sender_id (full_name, profile_photo)
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      if (user) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const subscribeToMessages = (conversationId) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Check if message already exists (from optimistic update)
          const messageExists = messages.some((m) => m.id === payload.new.id);
          if (messageExists) return;

          const { data } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:sender_id (full_name, profile_photo)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              // Remove temporary message if exists
              const filtered = prev.filter((m) => m.id !== "temp");
              return [...filtered, data];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    const tempMessage = {
      id: "temp",
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      content: messageText.trim(),
      created_at: new Date().toISOString(),
      sender: {
        full_name: user.user_metadata?.full_name || "You",
      },
    };

    // Optimistic update - add message immediately
    setMessages((prev) => [...prev, tempMessage]);
    const currentMessage = messageText;
    setMessageText("");
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: selectedConversation.id,
            sender_id: user.id,
            content: currentMessage.trim(),
          },
        ])
        .select(
          `
          *,
          sender:sender_id (full_name, profile_photo)
        `
        )
        .single();

      if (error) throw error;

      // Replace temporary message with real one
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== "temp");
        return [...filtered, data];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove failed message and restore text
      setMessages((prev) => prev.filter((m) => m.id !== "temp"));
      setMessageText(currentMessage);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>

            <nav className="flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Home
              </Link>
              <Link
                href="/care-team"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Care Team
              </Link>
              <Link
                href="/jobs"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Jobs
              </Link>
              <Link href="/messages" className="text-blue-600 font-semibold">
                Messages
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Messages Layout */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div
          className="bg-white rounded-xl shadow-md overflow-hidden"
          style={{ height: "calc(100vh - 180px)" }}
        >
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 border-b hover:bg-gray-50 transition text-left ${
                        selectedConversation?.id === conv.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                          {conv.otherUser?.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {conv.otherUser?.full_name || "User"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Click to start messaging
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {selectedConversation.otherUser?.full_name?.charAt(0) ||
                          "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedConversation.otherUser?.full_name || "User"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => {
                      const isSent = message.sender_id === user.id;
                      const isTemp = message.id === "temp";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isSent ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isSent
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-900"
                            } ${isTemp ? "opacity-60" : ""}`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isSent ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {isTemp
                                ? "Sending..."
                                : formatDistanceToNow(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-6 border-t">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex space-x-3"
                    >
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        maxLength={2000}
                        disabled={sending}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
                      />
                      <button
                        type="submit"
                        disabled={sending || !messageText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {sending ? "..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
