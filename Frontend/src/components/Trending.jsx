import React, { useContext, useEffect, useState } from "react";
import BlogItems from "../components/BlogItems";
import { BlogContext } from "../Context/BlogContext";
import Loader from "../components/shared/Loader";
import Error from "../components/shared/Error";

function Trending() {
  const { trending } = useContext(BlogContext);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setFetchError(true);
        setLoading(false);
      }
    }, 10000); // 10 seconds max loading

    // Simulate context data load delay
    if (Array.isArray(trending)) {
      if (trending.length > 0 || trending.length === 0) {
        setLoading(false);
      }
    }

    return () => clearTimeout(timer);
  }, [trending, loading]);

  const safeTrending = Array.isArray(trending) ? trending : [];
  const blogsToShow = showAll ? safeTrending : safeTrending.slice(0, 6);

  if (loading) return <Loader message="Fetching trending blogs..." />;
  if (fetchError)
    return <Error message="Error fetching trending blogs. Please check your internet connection." />;

  return (
    <div className="font-serif pt-10 bg-gray-950 min-h-screen">
      <h2 className="pl-10 text-green-600 mb-7">Trending Blogs</h2>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 bg-gray-950">
        {safeTrending.length < 1 ? (
          <h1 className="text-center text-gray-400 py-8">
            No Trending Blogs Yet
          </h1>
        ) : (
          blogsToShow.map((blog) => (
            <BlogItems key={blog.id || blog._id} blog={blog} />
          ))
        )}
      </div>

      {safeTrending.length > 6 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 border border-green-600 rounded-lg text-green-600 hover:bg-green-600 hover:text-white mb-7 transition-all"
          >
            {showAll ? "View Less" : "View More Trending Blogs"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Trending;
