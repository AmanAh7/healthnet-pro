"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfileStats({ userId }) {
  const [profileViews, setProfileViews] = useState(0);
  const [connections, setConnections] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      try {
        const { count: viewsCount } = await supabase
          .from("profile_views")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", userId);

        setProfileViews(viewsCount || 0);

        const { count: connectionsCount } = await supabase
          .from("care_team")
          .select("*", { count: "exact", head: true })
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
          .eq("status", "accepted");

        setConnections(connectionsCount || 0);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    const careTeamSubscription = supabase
      .channel("care_team_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_team",
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    const viewsSubscription = supabase
      .channel("profile_views_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profile_views",
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      careTeamSubscription.unsubscribe();
      viewsSubscription.unsubscribe();
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t">
        <div className="animate-pulse flex flex-col space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">Profile Views</span>
        <span className="text-blue-600 font-semibold">{profileViews}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Connections</span>
        <span className="text-blue-600 font-semibold">{connections}</span>
      </div>
    </div>
  );
}
