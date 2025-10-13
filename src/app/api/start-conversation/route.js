import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { currentUserId, otherUserId } = await request.json();

    // Call the stored procedure to get or create conversation
    const { data, error } = await supabase.rpc("get_or_create_conversation", {
      current_user_id: currentUserId,
      other_user_id: otherUserId,
    });

    if (error) throw error;

    return NextResponse.json({ conversationId: data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
