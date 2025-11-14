import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { FaTrash, FaReply } from "react-icons/fa";

const Comment = ({ comment, addReply, removeComment, currentUserId, role }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");

  const canDelete =
    comment.author &&
    (currentUserId === comment.author.id || role?.toUpperCase() === "ADMIN" || "CREATOR");

  const handleDelete = async () => {
    try {
      const res = await fetch(
        `https://blug-be-api.onrender.com/api/comments/${comment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (res.ok) removeComment(comment.id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) return;
    await addReply(comment.id, replyText);
    setReplyText("");
    setShowReplyInput(false);
  };

  return (
    <div className="mb-3 ml-4 border-l border-gray-700 pl-3 transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-start">
        <p className="text-sm text-white leading-relaxed">
          <strong>{comment.author?.username || "Unknown"}:</strong>{" "}
          {comment.content}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            <FaReply /> Reply
          </button>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      {showReplyInput && (
        <div className="flex mt-2">
          <input
            type="text"
            className="px-2 py-1 rounded w-full text-white bg-gray-800 focus:outline-none"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
          />
          <button
            onClick={handleAddReply}
            className="ml-2 px-3 py-1 bg-green-600 rounded text-white hover:bg-green-500"
          >
            Reply
          </button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              addReply={addReply}
              removeComment={removeComment}
              currentUserId={currentUserId}
              role={role}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentSection = ({ blogId }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Decode error:", err);
      }
    }
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `https://blug-be-api.onrender.com/api/blogs/${blogId}/comments`
      );
      const data = await res.json();
      setComments(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Fetch comments error:", err);
    }
  };

  useEffect(() => {
    if (blogId) fetchComments();
  }, [blogId]);

  // ✅ POST comment and immediately update list
  const addComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(
        `https://blug-be-api.onrender.com/api/blogs/${blogId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: commentText }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        // ✅ Either append new comment or re-fetch full list
        if (data.comment) {
          setComments((prev) => [...prev, data.comment]);
        } else {
          await fetchComments();
        }
        setCommentText("");
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Post comment error:", err);
    } finally {
      setPosting(false);
    }
  };

  const addReply = async (parentId, text) => {
    try {
      const res = await fetch(
        `https://blug-be-api.onrender.com/api/blogs/${blogId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: text, parentId }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        if (data.comment) {
          await fetchComments();
        }
      }
    } catch (err) {
      console.error("Reply error:", err);
    }
  };

  const removeComment = (id) => {
    const removeRecursive = (list) =>
      list
        .filter((c) => c.id !== id)
        .map((c) => ({
          ...c,
          replies: c.replies ? removeRecursive(c.replies) : [],
        }));
    setComments((prev) => removeRecursive(prev));
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded mt-10 font-serif">
      <h3 className="text-lg font-bold text-green-500 mb-3">Comments</h3>

      <div className="flex mb-3">
        <input
          type="text"
          placeholder="Add a comment..."
          className="px-3 py-2 rounded w-full text-white mr-2 bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={posting}
        />
        <button
          onClick={addComment}
          disabled={posting}
          className={`text-sm px-4 py-1 rounded ${
            posting
              ? "bg-gray-600 text-gray-400"
              : "bg-green-700 hover:bg-green-600"
          }`}
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            addReply={addReply}
            removeComment={removeComment}
            currentUserId={currentUser?.id}
            role={currentUser?.role}
          />
        ))
      )}
    </div>
  );
};

export default CommentSection;
