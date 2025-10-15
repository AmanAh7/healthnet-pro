"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreatePost({ user, profile, onPostCreated }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      onPostCreated(data);
      setContent("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6">
      {/* Collapsed View - LinkedIn Style */}
      {!isExpanded ? (
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 px-4 py-3 text-left text-gray-500 border border-gray-300 rounded-full hover:bg-gray-50 transition"
            >
              Start a post
            </button>
          </div>

          {/* Media Options */}
          <div className="flex items-center justify-around pt-2 border-t">
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
              <svg
                className="w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              <span className="hidden sm:inline text-sm font-semibold">
                Photo
              </span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
              <span className="hidden sm:inline text-sm font-semibold">
                Video
              </span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition">
              <svg
                className="w-6 h-6 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span className="hidden sm:inline text-sm font-semibold">
                Article
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Expanded View */
        <div className="p-4">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {profile?.user_type || "Professional"}
              </p>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What do you want to talk about?"
            className="w-full px-4 py-3 border-0 focus:ring-0 outline-none resize-none text-gray-900 placeholder-gray-400"
            rows={4}
            maxLength={3000}
            autoFocus
          />

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </button>
              <span className="text-xs text-gray-500">
                {content.length}/3000
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setContent("");
                  setIsExpanded(false);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!content.trim() || posting}
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
