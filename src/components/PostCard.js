"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "@/lib/utils";
import Link from "next/link";

export default function PostCard({ post, currentUser, onDelete }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const isLiked = likes.some((like) => like.user_id === currentUser?.id);
  const isOwnPost = post.user_id === currentUser?.id;

  const handleLike = async () => {
    try {
      if (isLiked) {
        const likeToRemove = likes.find(
          (like) => like.user_id === currentUser.id
        );
        await supabase.from("likes").delete().eq("id", likeToRemove.id);
        setLikes(likes.filter((like) => like.user_id !== currentUser.id));
      } else {
        const { data, error } = await supabase
          .from("likes")
          .insert([{ user_id: currentUser.id, post_id: post.id }])
          .select()
          .single();

        if (error) throw error;
        setLikes([...likes, data]);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            user_id: currentUser.id,
            post_id: post.id,
            content: commentText.trim(),
          },
        ])
        .select(
          `
          *,
          profiles:user_id (full_name, profile_photo)
        `
        )
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentText("");
      setShowComments(true);
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <Link href={`/profile/${post.user_id}`}>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0 cursor-pointer hover:bg-blue-200 transition">
              {post.profiles?.full_name?.charAt(0) || "U"}
            </div>
          </Link>
          <div className="flex-1">
            <Link href={`/profile/${post.user_id}`}>
              <h3 className="font-bold text-gray-900 hover:text-blue-600 transition cursor-pointer">
                {post.profiles?.full_name || "User"}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">
              {post.profiles?.headline || "Healthcare Professional"} •{" "}
              {formatDistanceToNow(post.created_at)}
            </p>

            <p className="mt-4 text-gray-700 whitespace-pre-wrap">
              {post.content}
            </p>

            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 border-t pt-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition ${
                  isLiked
                    ? "text-blue-600 font-semibold"
                    : "hover:text-blue-600"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>
                  {isLiked ? "Liked" : "Like"}{" "}
                  {likes.length > 0 && `(${likes.length})`}
                </span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 hover:text-blue-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>
                  Comment {comments.length > 0 && `(${comments.length})`}
                </span>
              </button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                      {comment.profiles?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-sm text-gray-900">
                        {comment.profiles?.full_name || "User"}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {comment.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(comment.created_at)}
                      </p>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleComment} className="flex space-x-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    maxLength={1000}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !commentText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? "..." : "Post"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {isOwnPost && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
