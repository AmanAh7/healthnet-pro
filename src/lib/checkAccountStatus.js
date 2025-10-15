import { supabase } from "./supabase";

export async function checkAccountStatus(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", userId)
      .single();

    if (error) throw error;

    if (data.account_status === "deactivated") {
      // Reactivate account on login
      await supabase
        .from("profiles")
        .update({
          account_status: "active",
          deactivated_at: null,
        })
        .eq("id", userId);

      return {
        status: "reactivated",
        message: "Welcome back! Your account has been reactivated.",
      };
    }

    if (data.account_status === "deleted") {
      return { status: "deleted", message: "This account has been deleted." };
    }

    return { status: "active" };
  } catch (error) {
    console.error("Error checking account status:", error);
    return { status: "error" };
  }
}
