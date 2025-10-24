import React, { useState, useContext, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { BlogContext } from "../Context/BlogContext";
import CommentSection from "../Context/Coment";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";
import { FaHeart, FaTrash, FaBookmark, FaRegComment } from "react-icons/fa";
import { CiHeart, CiBookmark } from "react-icons/ci";
import { jwtDecode } from "jwt-decode";

function BlogDetails() {
  const { id } = useParams();
  const { blogs } = useContext(BlogContext);
  const navigate = useNavigate();

  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const token = localStorage.getItem("token");
  const API_BASE = "https://blug-be-api.onrender.com/api/blogs";
  const FAVORITE_BASE = "https://blug-be-api.onrender.com/favorites";

  // ✅ Decode JWT
  useEffect(() => {
    if (!token) return;
    try {
      const user = jwtDecode(token);
      setCurrentUser(user);
    } catch (err) {
      console.error("JWT decode error:", err);
    }
  }, [token]);

  // ✅ Get current blog
  const blog = blogs.find((b) => b.id.toString() === id);
  const blogId = blog?.id;

  // ✅ Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (blog) setLoading(false);
      else setFetchError(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [blog]);

  // ✅ Fetch like status
  useEffect(() => {
    if (!blogId) return;
    const fetchLikes = async () => {
      try {
        const res = await fetch(`${API_BASE}/${blogId}/likes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setLikesCount(data.count || 0);
        setLiked(Boolean(data.userLiked));
      } catch (err) {
        console.error("Failed to fetch like status:", err);
      }
    };
    fetchLikes();
  }, [blogId, token]);

  // ✅ Set comment count from blog data
  useEffect(() => {
    if (blog?.commentCount) setCommentCount(blog.commentCount);
  }, [blog]);

  // ✅ Fetch favorite status
  useEffect(() => {
    if (!blogId || !token) return;
    const checkFavorite = async () => {
      try {
        const res = await fetch(`${FAVORITE_BASE}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();

        const isFav = data.blogs?.some((fav) => fav.id === blogId);
        setFavorited(isFav);
      } catch (err) {
        console.error("Failed to check favorite:", err);
      }
    };
    checkFavorite();
  }, [blogId, token]);

  // ✅ Toggle like
  const handleLike = async () => {
    if (!token) return alert("Please log in to like this blog.");
    if (!blogId) return;
    try {
      const res = await fetch(`${API_BASE}/${blogId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Like toggle failed");
      const data = await res.json();
      setLiked(Boolean(data.liked));
      setLikesCount(data.count || 0);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  // ✅ Toggle favorite
  const handleFavorite = async () => {
    if (!token) return alert("Please log in to favorite blogs.");
    if (!blogId) return;
    try {
      const res = await fetch(`${FAVORITE_BASE}/toggle/${blogId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Favorite toggle failed");
      await res.json();
      setFavorited((prev) => !prev);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  // ✅ Delete blog
  const handleDelete = async () => {
    if (!token) return alert("Please log in first.");
    if (!blogId) return;
    try {
      const res = await fetch(`https://blug-be-api.onrender.com/api/blog/${blogId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("Blog deleted successfully");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ✅ Conditional Rendering
  if (loading) {
    return (
      <div className="bg-gray-950 text-white min-h-[70vh]">
        <Loader message="Fetching blog details..." />
      </div>
    );
  }

  if (fetchError || !blog) {
    return (
      <Error
        message="Blog not found or failed to load. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const canDelete =
    currentUser &&
    (currentUser.role?.toLowerCase() === "admin" ||
      (currentUser.id?.toString() || "") ===
        (blog?.author?.id?.toString() || ""));

  return (
    <div className="lg:flex bg-gray-950 gap-10">
      {/* --- Blog Main Content --- */}
      <div className="bg-gray-950 text-white p-5 font-serif lg:w-[60%]">
        <h2 className="text-green-600 text-2xl mb-3">{blog?.title || "Untitled"}</h2>

        {blog?.img && (
          <img
            src={blog.img}
            alt={blog.title || "blog image"}
            className="w-full max-h-[400px] object-cover mb-4 rounded-lg"
          />
        )}

        <p className="mb-5 leading-relaxed text-gray-200 whitespace-pre-line">
          {blog?.content || ""}
        </p>

        {/* --- Like + Favorite + Delete + Comments --- */}
        <div className="flex items-center gap-4 mb-6">
          {/* ❤️ Like */}
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {liked ? (
              <FaHeart style={{ color: "red", fontSize: "22px" }} />
            ) : (
              <CiHeart style={{ color: "white", fontSize: "22px" }} />
            )}
            <span className="text-sm text-gray-300">{likesCount}</span>
          </button>

          {/* 💬 Comment Count */}
          <div className="flex items-center gap-1 text-green-400">
            <FaRegComment style={{ fontSize: "20px" }} />
            <span className="text-sm text-gray-300">{commentCount}</span>
          </div>

          {/* 🔖 Favorite */}
          <button
            type="button"
            onClick={handleFavorite}
            className="flex items-center gap-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            {favorited ? (
              <FaBookmark style={{ color: "#22c55e", fontSize: "22px" }} />
            ) : (
              <CiBookmark style={{ color: "white", fontSize: "22px" }} />
            )}
          </button>

          {/* 🗑 Delete */}
          {canDelete && (
            <FaTrash
              className="text-red-500 cursor-pointer ml-2"
              title="Delete Blog"
              onClick={handleDelete}
            />
          )}
        </div>

        <CommentSection blogId={blog.id} />
      </div>

      {/* --- Sidebar: Other Blogs --- */}
      <div className="lg:w-[40%] bg-gray-900 p-4 rounded-xl lg:mr-5 pb-7 overflow-y-auto max-h-[165vh] [&::-webkit-scrollbar]:hidden">
        <h2 className="text-xl font-bold mb-4 text-green-500">📝 Other Blogs</h2>
        <div className="space-y-7">
          {blogs
            .filter((b) => b.id.toString() !== id)
            .slice(0, 3)
            .map((b) => (
              <Link key={b.id} to={`/blog/${b.id}`} className="block">
                <div className="border rounded-lg p-3 hover:shadow-lg min-h-[3rem] transition cursor-pointer bg-gray-800">
                  {b.img && (
                    <img
                      src={b.img}
                      alt={b.title || "blog image"}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                  )}
                  <h6 className="font-semibold text-gray-200">{b.title || "Untitled"}</h6>
                  <p className="text-sm text-gray-400">
                    {b.content?.slice(0, 100) || ""}...
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

export default BlogDetails;
