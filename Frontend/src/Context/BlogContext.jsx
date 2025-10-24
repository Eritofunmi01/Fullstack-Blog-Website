import { createContext, useEffect, useState, useCallback } from "react";
import { getblogs } from "../services/blog";
import axios from "axios";

// ✅ Create context
export const BlogContext = createContext();

// ✅ Provider component
export const BlogProvider = ({ children }) => {
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [latest, setLatest] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const data = await getblogs();
        if (data) {
          setBlogs(data);
          setFilteredBlogs(data);

          // 👇 Use backend flags directly
          setLatest(data.filter((b) => b.latest === true));
          setTrending(data.filter((b) => b.trending === true));
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // ✅ Refresh blogs on demand (for create/edit/delete)
  const refreshBlogs = async () => {
    try {
      const data = await getblogs();
      if (data) {
        setBlogs(data);
        setFilteredBlogs(data);
        setLatest(data.filter((b) => b.latest === true));
        setTrending(data.filter((b) => b.trending === true));
      }
    } catch (error) {
      console.error("Failed to refresh blogs:", error);
    }
  };

  // ✅ Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          "https://blug-be-api.onrender.com/api/categories"
        );
        // 👇 categories are inside `res.data.data`
        setCategories(res.data.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Memoized filter function (handles id & _id & name safely)
  const filterByCategory = useCallback(
    (categoryId) => {
      if (!categoryId) {
        setFilteredBlogs(blogs);
        return;
      }

      const filtered = blogs.filter(
        (b) =>
          b.categoryId === parseInt(categoryId) || // numeric id
          b.Category?.id === parseInt(categoryId) || // nested SQL style
          b.Category?._id === categoryId || // MongoDB style
          b.Category?.name?.toLowerCase() === categoryId.toLowerCase() // by name
      );

      setFilteredBlogs(filtered);
    },
    [blogs]
  );

  return (
    <BlogContext.Provider
      value={{
        blogs,
        filteredBlogs,
        latest,
        trending,
        categories,
        setBlogs,
        filterByCategory,
        loading,
        refreshBlogs, // ✅ new addition
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
