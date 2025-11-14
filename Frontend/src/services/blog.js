export const getblogs = async (category) => {
  let url = "https://blug-be-api.onrender.com/api/blogs";
  if (category) url += `?category=${category}`;
  
  const res = await fetch(url);
  const result = await res.json();

  // ✅ Fix: check if result is an array or has a data field
  const blogs = Array.isArray(result) ? result : result.data;

  return (blogs || []).map((blog) => ({
    id: blog.id || blog._id,
    ...blog,
  }));
};
