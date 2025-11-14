import React, { useContext, useEffect, useState } from "react";
import BlogItems from "../components/BlogItems";
import { BlogContext } from "../Context/BlogContext";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";

function LatestBlog() {
  const { latest } = useContext(BlogContext);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showAllLatest, setShowAllLatest] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setFetchError(true);
        setLoading(false);
      }
    }, 10000); // 10 seconds max loading

    // Simulate context data load delay
    if (Array.isArray(latest)) {
      if (latest.length > 0 || latest.length === 0) {
        setLoading(false);
      }
    }

    return () => clearTimeout(timer);
  }, [latest, loading]);

  const safeLatest = Array.isArray(latest) ? latest : [];
  const blogsToShow = showAllLatest ? safeLatest : safeLatest.slice(0, 6);

  if (loading) return <Loader message="Fetching latest blogs..." />;
  if (fetchError)
    return <Error message="Error fetching latest blogs. Please check your internet connection." />;

  return (
    <div className="font-serif pt-20 bg-gray-950 min-h-screen">
      <h2 className="pl-10 text-green-600 mb-7">Latest Blogs</h2>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 bg-gray-950">
        {safeLatest.length < 1 ? (
          <h1 className="text-center text-gray-400 py-8">
            No Latest Blogs Yet
          </h1>
        ) : (
          blogsToShow.map((blog) => (
            <BlogItems key={blog.id || blog._id} blog={blog} />
          ))
        )}
      </div>

      {safeLatest.length > 6 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAllLatest(!showAllLatest)}
            className="px-4 py-2 border border-green-600 rounded-lg text-green-600 hover:bg-green-600 hover:text-white transition-all"
          >
            {showAllLatest ? "Show Less" : "View More Latest Blogs"}
          </button>
        </div>
      )}
    </div>
  );
}

export default LatestBlog;
