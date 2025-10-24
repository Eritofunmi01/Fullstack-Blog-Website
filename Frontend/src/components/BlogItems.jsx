import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import Container from "./shared/Container";
import CommentSection from "../Context/Coment";
import Like from "../Context/Like";
import { FaRegComment, FaFire } from "react-icons/fa";
import Loader from "./shared/Loader";
import Error from "./shared/Error";

function BlogItems({ blog }) {
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Simulate fetch timeout (10 seconds)
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setFetchError(true);
        setLoading(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Stop loading once blog arrives
  useEffect(() => {
    if (blog) setLoading(false);
  }, [blog]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-950 min-h-[50vh] text-white">
        <Loader message="Fetching blogs..." />
      </div>
    );
  }

  // Error state
  if (fetchError || !blog) {
    return (
      <div className="bg-gray-950 min-h-[50vh] text-white">
        <Error
          message="Failed to load blogs. Please check your internet connection."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Prepare blog content
  const preview =
    typeof blog?.content === "string"
      ? blog.content.split(" ").slice(0, 30).join(" ") + "..."
      : "";

  const formattedDate = blog?.createdAt
    ? new Date(blog.createdAt).toLocaleDateString()
    : "Unknown date";

  const hasImage = blog?.img && blog.img.trim() !== "";

  return (
    <Container>
      <div className="bg-gray-950 font-serif pr-5 pb-10 text-white">
        <div
          className={`relative border border-green-700 rounded-2xl ml-7 overflow-hidden shadow-lg shadow-green-900/20 hover:shadow-green-600/40 transition duration-300 flex flex-col ${
            hasImage ? "h-[34rem]" : "h-auto"
          }`}
        >
          {/* Trending / Latest Badge */}
          {blog?.trending ? (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              <FaFire /> Trending
            </span>
          ) : blog?.latest ? (
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              Latest
            </span>
          ) : null}

          {/* Blog Image (if exists) */}
          {hasImage && (
            <div className="w-full h-[13rem] bg-gray-800 overflow-hidden">
              <img
                src={blog.img}
                alt={blog?.title ? `${blog.title} cover` : "blog image"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}

          {/* Blog Info */}
          <div
            className={`p-5 flex-1 flex flex-col justify-between ${
              hasImage ? "" : "pt-8 pb-6"
            }`}
          >
            <div className="space-y-2">
              <h5 className="text-green-400 text-xl font-bold group-hover:text-green-500 transition-colors duration-200">
                {blog.title}
              </h5>

              <p className="text-sm text-gray-400 italic">
                Category:{" "}
                <span className="text-green-300">
                  {blog?.Category?.name || "General"}
                </span>
              </p>

              <p className="text-gray-300 leading-relaxed line-clamp-3">
                {preview}
              </p>
            </div>

            {/* Author & Date */}
            <div className="mt-4 text-gray-400 text-xs">
              <Link
                to={`/profile/${blog.authorId}`}
                className="inline-block text-green-400 hover:underline cursor-pointer"
              >
                By {blog?.author?.username || "Unknown"}
              </Link>
              <span className="ml-1">• {formattedDate}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mt-5">
              <a
                href={`/blog/${blog.id}`}
                className="relative border border-green-600 px-4 py-1.5 rounded-2xl overflow-hidden group cursor-pointer bg-transparent"
              >
                <span className="relative z-10 text-white group-hover:text-green-400 transition duration-200">
                  Continue Reading
                </span>
                <span className="absolute inset-0 bg-green-600 opacity-0 group-hover:opacity-20 transition duration-300"></span>
              </a>

              <div className="flex gap-4 items-center">
                <Like blogId={blog?.id} />
                <button
                  onClick={() => setShowComments((prev) => !prev)}
                  className="flex items-center space-x-1 text-green-400 text-md hover:text-green-600 transition duration-150"
                >
                  <FaRegComment size={20} />
                  <span className="text-sm">{blog?.commentCount || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && blog?.id && (
          <div className="ml-7 mt-4 border border-green-800 p-2 rounded-lg transition-all duration-300">
            <CommentSection blogId={blog.id} />
          </div>
        )}
      </div>
    </Container>
  );
}

export default BlogItems;
