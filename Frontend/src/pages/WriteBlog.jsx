import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { BlogContext } from '../Context/BlogContext';
import { useNavigate, useLocation } from 'react-router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function WriteBlog() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [draftCount, setDraftCount] = useState(0);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ✅ include refreshBlogs from context
  const { blogs, setBlogs, refreshBlogs } = useContext(BlogContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Load draft if editing
  useEffect(() => {
    if (location.state?.draft) {
      const draft = location.state.draft;
      setTitle(draft.title || '');
      setContent(draft.content || '');
      setSelectedCategory(draft.categoryId || null);
      setImage(draft.img || null);
      setDraftId(draft.id);
    }
  }, [location.state]);

  // Count drafts for red dot
  useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem("drafts") || "[]");
    setDraftCount(drafts.length);
  }, []);

  // Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setImage(URL.createObjectURL(file));
    setImageFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop,
    multiple: false,
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("https://blug-be-api.onrender.com/api/categories");
        const result = await res.json();
        const fetchedCategories = result.data || [];
        setCategories(fetchedCategories);

        const general = fetchedCategories.find(cat => cat.name.toLowerCase() === "general");
        if (general) setSelectedCategory(general.id);
        else if (fetchedCategories.length > 0) setSelectedCategory(fetchedCategories[0].id);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  // Handle submit (publish)
  const handleSubmit = async (type) => {
    if (loading) {
      toast.info("Please wait, still publishing...");
      return;
    }

    setStatus(type);
    if (!title || !content || !selectedCategory) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("categoryId", selectedCategory);
      formData.append("status", type);
      if (imageFile) formData.append("img", imageFile);

      const token = localStorage.getItem("token");

      const res = await fetch("https://blug-be-api.onrender.com/api/create-blog", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        const newBlog = {
          id: data.blog?.id || blogs.length + 1,
          title,
          content,
          img: data.blog?.img || image,
          category_id: selectedCategory,
          category_name:
            categories.find((c) => c.id === Number(selectedCategory))?.name || "General",
          status: type,
          latest: true,
          trending: false,
          createdAt: new Date().toISOString(),
        };

        const updatedBlogs = [...blogs, newBlog];
        setBlogs(updatedBlogs);
        localStorage.setItem("blogs", JSON.stringify(updatedBlogs));

        // 🧹 Remove draft after publishing
        if (draftId) {
          let drafts = JSON.parse(localStorage.getItem("drafts") || "[]");
          drafts = drafts.filter(d => d.id !== draftId);
          localStorage.setItem("drafts", JSON.stringify(drafts));
          setDraftCount(drafts.length);
        }

        // ✅ Refresh all blogs from backend immediately
        await refreshBlogs();

        toast.success("Blog created successfully!");
        setTimeout(() => navigate("/blogs"), 800); // small delay for smoother UX
      } else {
        toast.error(data.message || "Failed to create blog");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.error("Something went wrong while creating blog");
    } finally {
      setLoading(false);
    }
  };

  // Save draft
  const handleSaveDraft = () => {
    if (loading) {
      toast.info("Please wait, still saving...");
      return;
    }

    const drafts = JSON.parse(localStorage.getItem("drafts") || "[]");
    const id = draftId || Date.now();
    const draft = { id, title, content, categoryId: selectedCategory, img: image, savedAt: new Date().toISOString() };

    const index = drafts.findIndex(d => d.id === id);
    if (index > -1) drafts[index] = draft;
    else drafts.push(draft);

    localStorage.setItem("drafts", JSON.stringify(drafts));
    setDraftId(id);
    setDraftCount(drafts.length);
    toast.success("Draft saved!");
  };

  // Sidebar data
  const latestBlogs = blogs.filter(b => b.latest && b.status === 'published')
                           .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const trending = blogs.filter(b => b.trending && b.status === 'published')
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const [showAllTrending, setShowAllTrending] = useState(false);
  const ShowTrending = showAllTrending ? trending : trending.slice(0, 4);

  return (
    <div className="font-serif bg-gray-100 min-h-screen pt-10 flex flex-col lg:flex-row relative">

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="loader border-4 border-t-4 border-gray-200 rounded-full w-16 h-16 animate-spin"></div>
        </div>
      )}

      {/* Main Blog Area */}
      <div className="shadow-3xl w-[90%] lg:w-[60%] mx-auto lg:mx-0 bg-white pb-10 rounded-xl overflow-hidden mb-10 lg:mb-0">

        {image && <img src={image} alt="Blog Cover" className="w-full h-52 object-cover rounded-t-md" />}
        <div {...getRootProps()} className="cursor-pointer border border-dashed border-gray-400 px-4 py-4 mx-5 my-4 text-center rounded-md bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-500">
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop the image here...</p> : <p>Click or drag to upload cover image</p>}
        </div>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="border-0 outline-0 ml-5 text-gray-600 placeholder:text-4xl text-3xl p-2 w-[90%]" placeholder="Title" />

        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="10"
          className="w-[90%] ml-5 text-lg focus:outline-0 placeholder:text-2xl placeholder:text-gray-600 text-gray-600 p-3 bg-gray-50 mt-4 rounded-md"
          placeholder="Write your content here..." />

        <div className="ml-5 mt-4">
          <label className="block mb-2 text-gray-600 font-medium">Category</label>
          <select value={selectedCategory || ""} onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-md w-[50%]">
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-4 ml-5 mt-6 items-center">
          <button onClick={() => navigate('/drafts')} className="relative bg-gray-600 w-[30%] md:w-[150px] p-2 rounded-full text-white font-semibold text-lg hover:bg-gray-700 transition">
            Show Drafts
            {draftCount > 0 && (
              <span className="absolute top-0 right-0 mt-[-4px] mr-[-4px] w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </button>

          <button onClick={handleSaveDraft} disabled={loading} className="bg-yellow-400 w-[30%] md:w-[150px] p-2 rounded-full text-white font-semibold text-lg hover:bg-yellow-500 transition disabled:opacity-50">
            Save Draft
          </button>

          <button onClick={() => handleSubmit('published')} disabled={loading} className="bg-green-600 w-[30%] md:w-[150px] p-2 rounded-full text-white font-semibold text-lg hover:bg-green-700 transition disabled:opacity-50">
            Publish
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block lg:w-[25%] bg-white shadow-lg ml-5 mr-8 rounded-xl overflow-y-scroll scrollbar-none h-[80vh] p-4 [&::-webkit-scrollbar]:hidden">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-700 mb-4">🔥 Trending Blogs</h2>
          <ul className="space-y-3">
            {ShowTrending.length ? ShowTrending.map(blog => (
              <li key={blog.id} className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/blog/${blog.id}`)}>{blog.title}</li>
            )) : <li className="text-gray-500">No trending blogs</li>}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-4">🆕 Latest Blogs</h2>
          <div className="space-y-4">
            {latestBlogs.map(blog => (
              <div key={blog.id} className="border min-h-[5rem] rounded-lg p-3 hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/blog/${blog.id}`)}>
                {blog.img && <img src={blog.img} alt={blog.title} className="w-full h-24 object-cover rounded-md mb-2" />}
                <h6 className="font-semibold text-gray-800">{blog.title}</h6>
                <p className="text-sm text-gray-500">{blog.content.slice(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}

export default WriteBlog;
