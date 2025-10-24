import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BlogContext } from "../Context/BlogContext";
import { getblogs } from "../services/blog";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";

export default function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { setBlogs } = useContext(BlogContext);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 🔹 Fetch Blog + Categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(false);
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch blog + categories simultaneously
        const [blogRes, catRes] = await Promise.all([
          axios.get(`https://blug-be-api.onrender.com/api/blog/${id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          axios.get("https://blug-be-api.onrender.com/api/categories"),
        ]);

        const blog = blogRes.data?.data || blogRes.data || {};
        const fetchedCategories = catRes.data?.data || [];

        setCategories(fetchedCategories);
        setTitle(blog.title ?? "");
        setContent(blog.content ?? "");
        setPreviewUrl(blog.img ?? "");

        // Set current category
        const catId = blog.Category?.id ?? blog.categoryId ?? "";
        setSelectedCategory(String(catId));

      } catch (err) {
        console.error("Get Blog Error:", err);
        setError(true);
        toast.error("Failed to fetch blog details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const refreshBlogs = async () => {
    try {
      const data = await getblogs();
      setBlogs(data);
      localStorage.setItem("blogs", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to refresh blogs:", err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      let res;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("content", content);
        if (selectedCategory) formData.append("categoryId", selectedCategory);
        formData.append("img", selectedFile);

        res = await axios.put(
          `https://blug-be-api.onrender.com/api/blog/${id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        res = await axios.put(
          `https://blug-be-api.onrender.com/api/blog/${id}`,
          { title, content, categoryId: selectedCategory },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success(res.data?.message || "Blog updated successfully");
      await refreshBlogs();
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      console.error("Update Error:", err);
      toast.error("Failed to update blog.");
    } finally {
      setSaving(false);
    }
  };

  // 🔸 UI States
  if (loading) return <Loader message="Loading blog details..." />;
  if (error)
    return (
      <Error
        message="Failed to load blog details. Please try again."
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-gray-800 p-6 rounded-2xl shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Edit Blog</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block mb-1 text-sm text-gray-400">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter blog title"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block mb-1 text-sm text-gray-400">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your content..."
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block mb-1 text-sm text-gray-400">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div
            className={`border-2 border-dashed p-4 rounded-lg text-center transition ${
              dragOver ? "border-blue-500 bg-gray-700" : "border-gray-600"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current.click()}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-md mb-2"
              />
            ) : (
              <p className="text-gray-400">
                Drag & drop an image here or click to select
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-2 rounded-md font-semibold transition ${
              saving
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </motion.div>

      <ToastContainer position="top-right" autoClose={2200} />
    </div>
  );
}
