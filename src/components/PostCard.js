"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default function PostCard({ post, currentUser, onDelete }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const isLiked = likes.some((like) => like.user_id === currentUser?.id);
  const isOwnPost = post.user_id === currentUser?.id;
  const content = post.content || "";
  const maxPreview = 300;

  const handleLike = async () => {
    try {
      if (isLiked) {
        const likeToRemove = likes.find(
          (like) => like.user_id === currentUser.id
        );

        if (likeToRemove && likeToRemove.id) {
          const { error } = await supabase
            .from("likes")
            .delete()
            .eq("id", likeToRemove.id);
          if (error) throw error;
          setLikes(likes.filter((like) => like.user_id !== currentUser.id));
        }
      } else {
        const { data, error } = await supabase
          .from("likes")
          .insert([{ user_id: currentUser.id, post_id: post.id }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setLikes([...likes, data]);
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error.message || error);
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

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    const shareText = `Check out this post by ${
      post.profiles?.full_name || "someone"
    } on HealthNet Pro`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "HealthNet Pro Post",
          text: shareText,
          url: postUrl,
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(postUrl);
        alert("Link copied to clipboard!");
      } catch (error) {
        prompt("Copy this link:", postUrl);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-6">
      {/* Header Section */}
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Profile Picture */}
            <Link href={`/profile/${post.user_id}`}>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition flex-shrink-0">
                {post.profiles?.profile_photo ? (
                  <Image
                    src={post.profiles.profile_photo}
                    alt={post.profiles.full_name || "User"}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xl font-semibold text-blue-600">
                    {post.profiles?.full_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
            </Link>

            {/* User Info */}
            <div>
              <Link href={`/profile/${post.user_id}`}>
                <p className="font-bold leading-tight text-gray-900 hover:text-blue-600 cursor-pointer transition">
                  {post.profiles?.full_name || "User"}
                </p>
              </Link>
              <div className="flex items-center text-xs text-gray-500">
                <span>
                  {post.profiles?.headline || "Healthcare Professional"}
                </span>
                <span className="mx-1">•</span>
                <span>{formatDistanceToNow(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Three-dot menu or Delete Button */}
          {isOwnPost && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="4" cy="10" r="2" />
                <circle cx="10" cy="10" r="2" />
                <circle cx="16" cy="10" r="2" />
              </svg>
            </button>
          )}
        </div>

        {/* Post Content */}
        <div className="mt-3 text-gray-900 text-sm md:text-base whitespace-pre-wrap">
          {content.length <= maxPreview || showFull ? (
            content
          ) : (
            <>
              {content.slice(0, maxPreview).trim()}...
              <button
                onClick={() => setShowFull(true)}
                className="text-gray-600 hover:text-blue-600 ml-1 font-semibold"
              >
                more
              </button>
            </>
          )}
        </div>
      </div>

      {/* Engagement Bar */}
      <div className="px-4 md:px-6 pb-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            {likes.length > 0 && (
              <>
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span>{likes.length}</span>
              </>
            )}
          </div>
          {comments.length > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline hover:text-blue-600"
            >
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t px-4 md:px-6 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
              isLiked
                ? "text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span className="text-sm font-semibold">Like</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-semibold">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="text-sm font-semibold">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t px-4 md:px-6 py-4 bg-gray-50">
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {comment.profiles?.profile_photo ? (
                    <Image
                      src={comment.profiles.profile_photo}
                      alt={comment.profiles.full_name || "User"}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-600">
                      {comment.profiles?.full_name?.charAt(0) || "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
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
          </div>

          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
              {currentUser?.user_metadata?.full_name?.charAt(0) || "U"}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 text-sm font-semibold"
            >
              {loading ? "..." : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
