"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageButton({ currentUserId, otherUserId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartConversation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/start-conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserId,
          otherUserId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to messages page with conversation ID in state
      router.push(`/messages?conv=${data.conversationId}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartConversation}
      disabled={loading}
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
    >
      {loading ? "Loading..." : "Send Message"}
    </button>
  );
}
