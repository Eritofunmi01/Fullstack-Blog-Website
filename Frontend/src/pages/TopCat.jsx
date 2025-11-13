import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

function TopCategories() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("https://blug-be-api.onrender.com/api/top");
        // ✅ Handle both possible response formats
        const data = Array.isArray(res.data) ? res.data : res.data.categories;
        setCategories(data || []);
      } catch (err) {
        console.error("❌ Error fetching top categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId) => {
    // ✅ Navigate to blogs page filtered by category
    navigate(`/blogs?category=${categoryId}`);
  };

  return (
    <div className="bg-gray-950 py-8 px-6 text-center font-serif">
      <h2 className="text-2xl font-semibold text-green-500 mb-6">
        Top Categories
      </h2>

      {/* ✅ Safe render with fallback */}
      <div className="flex flex-wrap justify-center gap-4">
        {Array.isArray(categories) && categories.length > 0 ? (
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="
                bg-gray-900 text-green-500 border border-green-700
                px-5 py-2 rounded-full font-medium
                hover:bg-green-600 hover:text-white
                transition-all duration-300
                shadow-md hover:shadow-green-800/40
              "
            >
              {category.name}
            </button>
          ))
        ) : (
          <p className="text-gray-400">No Top category Yet</p>
        )}
      </div>
    </div>
  );
}

export default TopCategories;
