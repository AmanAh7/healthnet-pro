"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MessageButton({ currentUserId, otherUserId }) {
  const router = useRouter();

  const handleSendMessage = async () => {
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(user1_id.eq.${currentUserId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existingConversation) {
        router.push("/messages");
      } else {
        // Create new conversation
        const { data: newConversation, error } = await supabase
          .from("conversations")
          .insert([
            {
              user1_id: currentUserId,
              user2_id: otherUserId,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        router.push("/messages");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation");
    }
  };

  return (
    <button
      onClick={handleSendMessage}
      className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base font-semibold whitespace-nowrap"
    >
      Send Message
    </button>
  );
}
