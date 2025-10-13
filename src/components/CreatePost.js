"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreatePost({ user, profile, onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (content.length > 3000) {
      setError("Post content is too long (max 3000 characters)");
      return;
    }

    setLoading(true);
    setError("");

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

      setContent("");
      if (onPostCreated) {
        onPostCreated(data);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={3000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                {content.length}/3000
              </span>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
