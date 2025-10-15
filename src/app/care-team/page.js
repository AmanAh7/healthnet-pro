"use client";

import { useEffect, useState } from "react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function CareTeamPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [careTeamMembers, setCareTeamMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadCareTeam = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        await Promise.all([
          loadCareTeamMembers(user.id),
          loadPendingRequests(user.id),
          loadSuggestions(user.id),
        ]);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCareTeam();
  }, [router]);

  const loadCareTeamMembers = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("care_team")
        .select(
          `
          *,
          requester:requester_id (id, full_name, headline, user_type, profile_photo),
          receiver:receiver_id (id, full_name, headline, user_type, profile_photo)
        `
        )
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) throw error;

      const members = data.map((relation) => {
        const isRequester = relation.requester_id === userId;
        return isRequester ? relation.receiver : relation.requester;
      });

      setCareTeamMembers(members);
    } catch (error) {
      console.error("Error loading care team:", error);
    }
  };

  const loadPendingRequests = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("care_team")
        .select(
          `
          *,
          requester:requester_id (id, full_name, headline, user_type, profile_photo)
        `
        )
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const loadSuggestions = async (userId) => {
    try {
      const { data: existingConnections } = await supabase
        .from("care_team")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

      const connectedIds = new Set([userId]);
      existingConnections?.forEach((conn) => {
        connectedIds.add(conn.requester_id);
        connectedIds.add(conn.receiver_id);
      });

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, headline, user_type, profile_photo")
        .not("id", "in", `(${Array.from(connectedIds).join(",")})`)
        .limit(6);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("care_team")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;

      await Promise.all([
        loadCareTeamMembers(user.id),
        loadPendingRequests(user.id),
        loadSuggestions(user.id),
      ]);
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("care_team")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      setPendingRequests(pendingRequests.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      const { error } = await supabase.from("care_team").insert([
        {
          requester_id: user.id,
          receiver_id: receiverId,
          status: "pending",
        },
      ]);

      if (error) throw error;

      setSuggestions(suggestions.filter((s) => s.id !== receiverId));
    } catch (error) {
      console.error("Error sending request:", error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Remove this member from your Care Team?")) return;

    try {
      const { error } = await supabase
        .from("care_team")
        .delete()
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${memberId}),and(requester_id.eq.${memberId},receiver_id.eq.${user.id})`
        );

      if (error) throw error;

      setCareTeamMembers(careTeamMembers.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Error removing member:", error);
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/dashboard"
              className="text-xl md:text-2xl font-bold text-blue-600"
            >
              HealthNet Pro
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Home
              </Link>
              <Link href="/care-team" className="text-blue-600 font-semibold">
                Care Team
              </Link>
              <Link
                href="/jobs"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Jobs
              </Link>
              <Link
                href="/messages"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Messages
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t py-4 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Home
              </Link>
              <Link
                href="/care-team"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-blue-600 font-semibold hover:bg-gray-50 rounded"
              >
                Care Team
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Jobs
              </Link>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded"
              >
                Messages
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Care Team
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Connect with healthcare professionals to build your collaborative
            network
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b overflow-x-auto">
            <div className="flex space-x-4 md:space-x-8 px-4 md:px-6 min-w-max">
              <button
                onClick={() => setActiveTab("members")}
                className={`py-4 px-2 border-b-2 font-semibold transition whitespace-nowrap text-sm md:text-base ${
                  activeTab === "members"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                Care Team Members ({careTeamMembers.length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`py-4 px-2 border-b-2 font-semibold transition whitespace-nowrap text-sm md:text-base ${
                  activeTab === "requests"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                Pending Requests ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className={`py-4 px-2 border-b-2 font-semibold transition whitespace-nowrap text-sm md:text-base ${
                  activeTab === "suggestions"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-blue-600"
                }`}
              >
                Suggestions ({suggestions.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {/* Care Team Members Tab */}
            {activeTab === "members" && (
              <div>
                {careTeamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      You havent added anyone to your Care Team yet
                    </p>
                    <button
                      onClick={() => setActiveTab("suggestions")}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Find Healthcare Professionals
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {careTeamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 md:p-6 hover:shadow-lg transition"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Profile Picture with Image */}
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {member.profile_photo ? (
                              <Image
                                src={member.profile_photo}
                                alt={member.full_name || "User"}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-xl md:text-2xl font-bold text-blue-600">
                                {member.full_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${member.id}`}>
                              <h3 className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer truncate">
                                {member.full_name}
                              </h3>
                            </Link>
                            <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                              {member.headline || "Healthcare Professional"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {member.user_type}
                            </p>
                            <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                              <Link
                                href={`/profile/${member.id}`}
                                className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-semibold"
                              >
                                View Profile
                              </Link>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-xs md:text-sm text-red-600 hover:text-red-700 font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pending Requests Tab */}
            {activeTab === "requests" && (
              <div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4">
                          {/* Profile Picture with Image */}
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {request.requester.profile_photo ? (
                              <Image
                                src={request.requester.profile_photo}
                                alt={request.requester.full_name || "User"}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-xl md:text-2xl font-bold text-blue-600">
                                {request.requester.full_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">
                              {request.requester.full_name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {request.requester.headline ||
                                "Healthcare Professional"}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {request.requester.user_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 md:gap-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 md:flex-none px-4 md:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm md:text-base"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === "suggestions" && (
              <div>
                {suggestions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No suggestions available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="border rounded-lg p-4 md:p-6 hover:shadow-lg transition"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Profile Picture with Image */}
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {suggestion.profile_photo ? (
                              <Image
                                src={suggestion.profile_photo}
                                alt={suggestion.full_name || "User"}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-xl md:text-2xl font-bold text-blue-600">
                                {suggestion.full_name?.charAt(0) || "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate">
                              {suggestion.full_name}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                              {suggestion.headline || "Healthcare Professional"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {suggestion.user_type}
                            </p>
                            <button
                              onClick={() => handleSendRequest(suggestion.id)}
                              className="mt-3 md:mt-4 px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full text-sm md:text-base"
                            >
                              Add to Care Team
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
