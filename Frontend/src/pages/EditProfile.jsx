import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { useDropzone } from "react-dropzone";
import { FaUpload, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

export default function EditProfile() {
  const navigate = useNavigate();
  const API_URL = "https://blug-be-api.onrender.com/api";
  const token = localStorage.getItem("token");

  // Profile states
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [existingPic, setExistingPic] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Password visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const objectUrlRef = useRef(null);

  // ✅ Fetch current profile (authenticated user)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          toast.error("You must be logged in.");
          setLoading(false);
          return;
        }

        const res = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data.user || res.data;

        setUsername(user.username || "");
        setBio(user.bio || "");

        // ✅ If profilePic is a Cloudinary URL, use directly
        if (user.profilePic) {
          setExistingPic(user.profilePic);
        } else {
          setExistingPic(null);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [API_URL, token]);

  // ✅ Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const objUrl = URL.createObjectURL(file);
      objectUrlRef.current = objUrl;
      setProfilePic(file);
      setExistingPic(objUrl);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  // ✅ Save profile handler
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      if (!token) {
        toast.error("You must be logged in.");
        return;
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      if (profilePic) formData.append("profilePic", profilePic);

      const res = await axios.put(`${API_URL}/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updated = res.data.user || res.data;

      // ✅ Use Cloudinary URL directly
      if (updated?.profilePic) {
        setExistingPic(`${updated.profilePic}?t=${Date.now()}`);
      }

      toast.success("Profile updated successfully!");
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    }
  };

  // ✅ Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      setPwdLoading(true);
      await axios.put(
        `${API_URL}/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center items-center p-6 text-gray-100">
      <div className="w-full max-w-3xl bg-gray-900 shadow-xl rounded-2xl p-8 space-y-10 border border-gray-800">
        <h2 className="text-3xl font-bold text-center text-blue-400 border-b border-blue-500 pb-3">
          Edit Profile
        </h2>

        {/* Profile Section */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
            Profile Settings
          </h3>

          {/* Profile Pic */}
          <div className="flex flex-col items-center">
            <div
              {...getRootProps()}
              className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
                isDragActive
                  ? "border-blue-500 bg-blue-900/20 scale-105"
                  : "border-gray-600"
              }`}
            >
              <input {...getInputProps()} />
              {existingPic ? (
                <img
                  src={existingPic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <FaUpload size={24} />
                  <span className="text-xs mt-1">Upload</span>
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Drag & drop or click to upload
            </p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring focus:ring-blue-500"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* Password Section */}
        <form onSubmit={handleChangePassword} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-200 border-b border-gray-700 pb-2">
            Security Settings
          </h3>

          {/* Old Password */}
          <div className="relative">
            <input
              type={showOld ? "text" : "password"}
              placeholder="Current Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring focus:ring-red-500"
              required
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-400"
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring focus:ring-red-500"
              required
              minLength={8}
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-400"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring focus:ring-red-500"
              required
              minLength={8}
            />
            <span
              className="absolute right-3 top-3 cursor-pointer text-gray-400"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Change Password Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className={`px-6 py-2 rounded-lg text-white transition ${
                pwdLoading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {pwdLoading ? "Updating..." : "Change Password"}
            </button>
          </div>

          <Link to="/forget" className="text-blue-500 hover:border-blue-600 hover:text-white ">Forgotten Password</Link>
        </form>
      </div>
    </div>
  );
}
