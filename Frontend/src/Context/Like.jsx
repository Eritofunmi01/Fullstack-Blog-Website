import React, { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import axios from "axios";

export default function LikeButton({ blogId }) {
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = "https://blug-be-api.onrender.com/api/blogs";
  const token = localStorage.getItem("token");

  // 🔹 Fetch initial likes
  const fetchLikes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/${blogId}/likes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setLikes(res.data.count || 0);
      setUserLiked(res.data.userLiked || false);
    } catch (err) {
      console.error("Failed to fetch likes:", err);
      setUserLiked(false);
      setLikes(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (blogId) fetchLikes();
  }, [blogId]);

  // 🔹 Toggle like/unlike
  const handleLike = async () => {
    if (!token) {
      alert("Please log in to like this blog.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/${blogId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ✅ Instantly update from backend’s response
      if (res.data.updatedLikes) {
        setLikes(res.data.updatedLikes.count);
        setUserLiked(res.data.updatedLikes.userLiked);
      } else {
        // fallback if backend returns old structure
        setUserLiked(Boolean(res.data.liked));
        setLikes(res.data.count || 0);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  if (loading) {
    return (
      <button className="flex items-center gap-2 text-gray-400" disabled>
        <FaHeart /> ...
      </button>
    );
  }

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-2 transition-all ${
        userLiked ? "text-red-500" : "text-white"
      }`}
    >
      <FaHeart />
      <span>{likes}</span>
    </button>
  );
}
