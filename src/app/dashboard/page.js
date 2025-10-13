"use client";

import { useEffect, useState } from "react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(profile);

        await loadPosts();
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]); // Add router to dependencies

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          profiles:user_id (full_name, headline, profile_photo),
          likes (id, user_id),
          comments (
            id,
            content,
            created_at,
            user_id,
            profiles:user_id (full_name, profile_photo)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([
      {
        ...newPost,
        profiles: profile,
        likes: [],
        comments: [],
      },
      ...posts,
    ]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((post) => post.id !== postId));
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
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-600">
              HealthNet Pro
            </div>

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

              <div className="p-6 text-center -mt-12">
                <div className="inline-block relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full border-4 border-white flex items-center justify-center text-3xl font-bold text-blue-600">
                    {profile?.full_name?.charAt(0) || "U"}
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {profile?.full_name || "User"}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {profile?.headline || "Healthcare Professional"}
                </p>
                <p className="text-gray-500 text-xs mt-2 capitalize">
                  {profile?.user_type || "Professional"}
                </p>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="text-blue-600 font-semibold">142</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Connections</span>
                    <span className="text-blue-600 font-semibold">89</span>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition block text-center"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Access</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  My Network
                </a>
                <a
                  href="#"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Job Listings
                </a>
                <a
                  href="#"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition"
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  Learning
                </a>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            <CreatePost
              user={user}
              profile={profile}
              onPostCreated={handlePostCreated}
            />

            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500">
                  No posts yet. Be the first to share something!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onDelete={handlePostDeleted}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
