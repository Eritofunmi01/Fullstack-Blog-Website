import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FiLogIn, FiMenu, FiX, FiSearch } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import "@fontsource/poppins";

export default function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false); // 🔍 toggle for mobile search

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const handleChange = async (e) => {
    const query = e.target.value;
    setSearchTerm(query);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `https://blug-be-api.onrender.com/api/blogs/search?query=${encodeURIComponent(
          query.trim()
        )}`
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const result = await res.json();
      const data = Array.isArray(result?.data) ? result.data : [];

      setSuggestions(data.length ? data : [{ noResults: true }]);
    } catch (err) {
      console.error("Search error:", err);
      setSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/blogs?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileSearch(false);
    }
  };

  const handleSelect = (id) => {
    setSearchTerm("");
    setSuggestions([]);
    navigate(`/blog/${id}`);
    setMobileSearch(false);
  };

  const handleWriteClick = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await fetch("https://blug-be-api.onrender.com/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        navigate("/login");
        return;
      }

      const data = await res.json();
      const user = data?.user;

      if (!user) {
        navigate("/login");
        return;
      }

      if (user.role === "AUTHOR" || user.role === "ADMIN") {
        navigate("/write");
      } else {
        navigate("/subscribe");
      }
    } catch (err) {
      console.error("Error checking user role:", err);
      navigate("/login");
    }
  };

  return (
    <header
      className="w-full bg-gray-950 text-white p-4 flex justify-between h-[4rem] items-center shadow-md relative"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Brand + Mobile Search Icon */}
      <div className="flex items-center gap-3">
        {!mobileSearch && (
          <Link
            to="/"
            className="text-2xl md:text-3xl font-extrabold text-green-400 hover:text-green-300 transition tracking-wide"
          >
            Phantom Bluggers
          </Link>
        )}

        {/* 🔍 Mobile Search Button */}
        {!mobileSearch && (
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileSearch(true)}
          >
            <FiSearch size={20} />
          </button>
        )}
      </div>


      {/* Search Bar (Desktop or Toggled Mobile) */}
      {(mobileSearch || window.innerWidth >= 768) && (
        <div
          className={`${
            mobileSearch ? "absolute left-0 top-0 w-[18rem] p-4 bg-gray-950 z-50 flex" : "hidden md:block relative w-1/3"
          } transition-all duration-300 ease-in-out`}
        >
          <form onSubmit={handleSubmit} className="flex w-full relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search by title, author, or category..."
              className="w-[21rem] px-4 py-2 rounded-full text-white bg-gray-800 border border-green-500 focus:outline-none placeholder-gray-300"
              autoFocus={mobileSearch}
            />

            {/* Close Button for Mobile */}
            {mobileSearch && (
              <button
                type="button"
                onClick={() => setMobileSearch(false)}
                className="ml-2 text-gray-400 hover:text-white"
              >
                <FiX size={22} />
              </button>
            )}
          </form>

          {/* Suggestions Dropdown */}
          {Array.isArray(suggestions) && suggestions.length > 0 && (
            <ul className="absolute mt-9 left-0 w-full bg-gray-900 text-white rounded-lg shadow-lg max-h-64 overflow-y-auto z-50 border border-green-600">
              {suggestions[0]?.noResults ? (
                <li className="p-3 text-center text-gray-400">No search found.</li>
              ) : (
                suggestions.map((blog) => (
                  <li
                    key={blog.id}
                    className="p-3 hover:bg-green-500 hover:text-black cursor-pointer transition"
                    onClick={() => handleSelect(blog.id)}
                  >
                    <p className="font-semibold text-green-300">{blog.title}</p>
                    <p className="text-xs text-gray-300">
                      {blog.author?.username || "Unknown"} •{" "}
                      {blog.Category?.name || "Uncategorized"}
                    </p>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {/* Hamburger Menu Button (mobile) */}
      {!mobileSearch && (
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      )}

      {/* Nav Menu */}
      {!mobileSearch && (
        <nav
          className={`${
            menuOpen
              ? "flex flex-col gap-4 absolute top-16 left-0 w-full bg-gray-900 p-6 z-40"
              : "hidden md:flex md:gap-6 md:items-center"
          }`}
        >
          <Link
            to="/blogs"
            className="hover:text-black border rounded-full bg-green-400 w-20 text-center p-1 transition"
          >
            Blogs
          </Link>

          <button
            onClick={handleWriteClick}
            className="flex items-center gap-1 bg-blue-500 w-20 px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm md:text-base"
          >
            <FaPenToSquare /> Write
          </button>

          {!isLoggedIn ? (
            <>
              <Link
                to="/register"
                className="bg-green-500 px-3 py-2 rounded-lg hover:bg-green-600 transition text-sm md:text-base"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="bg-green-500 px-3 py-2 rounded-lg hover:bg-green-600 transition flex gap-2 text-sm md:text-base"
              >
                <FiLogIn className="mt-1" /> Login
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition text-sm md:text-base"
              >
                <FaUserCircle size={20} /> Profile
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-900 border border-green-500 rounded-lg shadow-lg z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-green-600 transition"
                    onClick={() => setProfileOpen(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
