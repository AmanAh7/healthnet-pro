"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function CareTeamButton({ currentUserId, profileUserId }) {
  const [isInCareTeam, setIsInCareTeam] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCareTeamStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, profileUserId]);

  const checkCareTeamStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("care_team")
        .select("id, status, requester_id")
        .or(
          `and(requester_id.eq.${currentUserId},receiver_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},receiver_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.status === "accepted") {
          setIsInCareTeam(true);
          setConnectionId(data.id);
        } else if (data.status === "pending") {
          setIsPending(true);
          setConnectionId(data.id);
        }
      }
    } catch (error) {
      console.error("Error checking care team status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCareTeam = async () => {
    try {
      const { error } = await supabase.from("care_team").insert([
        {
          requester_id: currentUserId,
          receiver_id: profileUserId,
          status: "pending",
        },
      ]);

      if (error) throw error;
      setIsPending(true);
      alert("Connection request sent!");
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request");
    }
  };

  const handleRemoveFromCareTeam = async () => {
    if (!confirm("Remove this person from your Care Team?")) return;

    try {
      const { error } = await supabase
        .from("care_team")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
      setIsInCareTeam(false);
      setIsPending(false);
      setConnectionId(null);
      alert("Removed from Care Team");
    } catch (error) {
      console.error("Error removing connection:", error);
      alert("Failed to remove connection");
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="w-full px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed text-sm md:text-base font-semibold"
      >
        Loading...
      </button>
    );
  }

  if (isInCareTeam) {
    return (
      <button
        onClick={handleRemoveFromCareTeam}
        className="w-full px-6 py-2 bg-white border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition text-sm md:text-base font-semibold whitespace-nowrap"
      >
        Remove Care Team
      </button>
    );
  }

  if (isPending) {
    return (
      <button
        disabled
        className="w-full px-6 py-2 bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed text-sm md:text-base font-semibold"
      >
        Request Pending
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCareTeam}
      className="w-full px-6 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm md:text-base font-semibold whitespace-nowrap"
    >
      Add to Care Team
    </button>
  );
}
