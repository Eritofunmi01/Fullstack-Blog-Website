import React, { useContext, useEffect, useState } from "react";
import { BlogContext } from "../Context/BlogContext";
import BlogItems from "../components/BlogItems";
import { useLocation, useNavigate } from "react-router";

function Blog() {
  const { filteredBlogs = [], filterByCategory, categories = [] } =
    useContext(BlogContext);

  const [currentBlogs, setCurrentBlogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const location = useLocation();
  const navigate = useNavigate();

  // 🔹 Extract category query param
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");

  // 🔹 Filter blogs when category changes
  useEffect(() => {
    filterByCategory(categoryId || null);
    setCurrentPage(1); // reset page when category changes
  }, [categoryId, filterByCategory]);

  // 🔹 Pagination calculation
  useEffect(() => {
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    setCurrentBlogs(filteredBlogs.slice(indexOfFirstPost, indexOfLastPost));
  }, [filteredBlogs, currentPage]);

  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="font-serif pt-30 bg-gray-950 min-h-screen flex flex-col">
      {/* 🔹 Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8 pt-6">
        {/* All button */}
        <button
          onClick={() => navigate("/blogs")}
          className={`px-4 py-2 rounded-lg border ${
            !categoryId
              ? "bg-green-600 text-white shadow-lg shadow-green-500/50"
              : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat._id || cat.id}
            onClick={() => navigate(`/blogs?category=${cat._id || cat.id}`)}
            className={`px-4 py-2 rounded-lg border ${
              categoryId === String(cat._id || cat.id)
                ? "bg-green-600 text-white shadow-lg shadow-green-500/50"
                : "border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 🔹 Blog Grid */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 bg-gray-950 flex-grow">
        {filteredBlogs.length < 1 ? (
          <h1 className="text-center text-white col-span-full">No Blogs Yet</h1>
        ) : (
          currentBlogs.map((items) => (
            <BlogItems key={items._id || items.id} blog={items} />
          ))
        )}
      </div>

      {/* 🔹 Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-6 text-white">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Prev
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded ${
                currentPage === num
                  ? "bg-green-800 shadow-lg shadow-green-500/50"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? "bg-gray-600"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Blog;
