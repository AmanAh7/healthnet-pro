"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData);
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  const handleDeactivateAccount = async () => {
    if (confirmText !== "DEACTIVATE") {
      alert('Please type "DEACTIVATE" to confirm');
      return;
    }

    setProcessing(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        account_status: "deactivated",
        deactivated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      alert("Failed to deactivate account");
      setProcessing(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      alert('Please type "DELETE" to confirm');
      return;
    }

    setProcessing(true);
    const userId = user.id;

    // Delete all related data
    await supabase.from("likes").delete().eq("user_id", userId);
    await supabase.from("comments").delete().eq("user_id", userId);
    await supabase.from("posts").delete().eq("user_id", userId);
    await supabase.from("job_applications").delete().eq("applicant_id", userId);
    await supabase.from("jobs").delete().eq("employer_id", userId);
    await supabase
      .from("care_team")
      .delete()
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    // Delete conversations and messages
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (conversations?.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      await supabase
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds);
      await supabase.from("conversations").delete().in("id", conversationIds);
    }

    // HARD DELETE - Remove profile completely
    await supabase.from("profiles").delete().eq("id", userId);

    // Sign out and redirect
    await supabase.auth.signOut();
    alert("Account permanently deleted. All data has been removed.");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-blue-600"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Account Settings
        </h1>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Account Status
          </h2>
          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold capitalize">
            {profile?.account_status || "Active"}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Deactivate Account
          </h2>
          <p className="text-gray-600 mb-4">
            Temporarily deactivate your account. Reactivate by logging in again.
          </p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li>• Profile hidden from searches</li>
            <li>• Posts will be hidden</li>
            <li>• Can reactivate anytime</li>
          </ul>
          <button
            onClick={() => setShowDeactivateModal(true)}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
          >
            Deactivate Account
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Delete Account
          </h2>
          <p className="text-red-600 font-semibold mb-2">
            ⚠️ This action cannot be undone!
          </p>
          <p className="text-gray-600 mb-4">
            Permanently delete your account and all data.
          </p>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li>• All data permanently removed</li>
            <li>• Posts, comments deleted</li>
            <li>• Connections removed</li>
            <li>• Cannot be recovered</li>
          </ul>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Confirm Deactivation</h3>
            <p className="text-gray-600 mb-4">
              Your account will be hidden. Reactivate by logging in again.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>DEACTIVATE</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DEACTIVATE"
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-900"
              autoComplete="off"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeactivateAccount}
                disabled={processing || confirmText !== "DEACTIVATE"}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Deactivate"}
              </button>
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setConfirmText("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              ⚠️ Permanently Delete Account
            </h3>
            <p className="text-gray-600 mb-4">
              This will <strong>permanently delete</strong> all your data. This
              action cannot be undone.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2 border rounded-lg mb-4 text-gray-900"
              autoComplete="off"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={processing || confirmText !== "DELETE"}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Deleting..." : "Delete Forever"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
