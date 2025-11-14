import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast, Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("https://blug-be-api.onrender.com/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Registration successful!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className='h-[] bg-[url("/Img/bg1.png")] bg-cover bg-center bg-fixed'>
      <Toaster />
      <div className='sm:pt-[10%] pt-40 pb-129 sm:pb-[60%] font-serif'>
        <form
          onSubmit={handleSubmit}
          className='fixed
            ml-[10%] w-[80%] 
            shadow-2xl shadow-green-700 bg-gray-950 rounded-2xl
            sm:ml-[10%] sm:mr-[10%] sm:w-[80%] 
            md:ml-[20%] md:mr-[20%] md:w-[60%] 
            lg:ml-[25%] lg:mr-[25%] lg:w-[50%]
          '
        >
          <h3 className='text-green-600 text-center pt-7 text-2xl sm:text-xl'>
            Register
          </h3>

          {error && <p className="text-red-500 text-center mb-3">{error}</p>}

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className='
              p-2 bg-white w-[80%] my-5 ml-7 rounded-full focus:outline
              sm:ml-4 sm:w-[92%]
            '
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className='
              p-2 bg-white w-[80%] my-5 ml-7 rounded-full focus:outline
              sm:ml-4 sm:w-[92%]
            '
          />

          {/* Password Input with Eye Toggle */}
          <div className="relative w-[80%] ml-7 sm:ml-4 sm:w-[92%] my-5">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className='
                p-2 bg-white w-full rounded-full focus:outline pr-10
              '
            />
            <span
              className="absolute right-3 top-2.5 text-gray-600 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button
            type="submit"
            className='
              bg-green-600 ml-[32%] mb-10 mt-4 w-[35%] cursor-pointer p-1 rounded-full
              hover:text-green-600 hover:bg-white hover:outline-green-600 hover:outline-2 
              text-white text-2xl
              sm:w-[30%] sm:text-lg md:mb-10
            '
          >
            Register
          </button>

          <div className="mt-2 text-center mb-4">
            <Link to="/login" className="text-green-600 hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
