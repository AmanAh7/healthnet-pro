"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CareTeamButton({ currentUserId, profileUserId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relationId, setRelationId] = useState(null);

  useEffect(() => {
    const checkCareTeamStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("care_team")
          .select("*")
          .or(
            `and(requester_id.eq.${currentUserId},receiver_id.eq.${profileUserId}),and(requester_id.eq.${profileUserId},receiver_id.eq.${currentUserId})`
          )
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setStatus(data.status);
          setRelationId(data.id);
        } else {
          setStatus(null);
        }
      } catch (error) {
        console.error("Error checking care team status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkCareTeamStatus();
  }, [currentUserId, profileUserId]);

  const handleAddToCareTeam = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("care_team").insert([
        {
          requester_id: currentUserId,
          receiver_id: profileUserId,
          status: "pending",
        },
      ]);

      if (error) throw error;
      setStatus("pending");
    } catch (error) {
      console.error("Error sending request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Remove from Care Team?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("care_team")
        .delete()
        .eq("id", relationId);

      if (error) throw error;
      setStatus(null);
      setRelationId(null);
    } catch (error) {
      console.error("Error removing from care team:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button className="mt-4 px-6 py-2 bg-gray-300 text-white rounded-lg cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (status === "accepted") {
    return (
      <button
        onClick={handleRemove}
        className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        Remove from Care Team
      </button>
    );
  }

  if (status === "pending") {
    return (
      <button
        onClick={handleRemove}
        className="mt-4 px-6 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        Care Team Request Sent
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCareTeam}
      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      Add to Care Team
    </button>
  );
}
