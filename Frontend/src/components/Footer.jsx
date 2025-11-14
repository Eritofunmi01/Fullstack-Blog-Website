import React from 'react'
import { Link } from 'react-router';
import { FaFacebook } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import { FaTiktok } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { FaGripLinesVertical } from "react-icons/fa6";

function Footer() {
  return (
    <div className='bg-slate-900'>

      {/* Responsive grid: 1 column on small screens, 3 columns on medium and up */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 font-serif px-6'>

        {/* Left Section */}
        <div className='text-white md:ml-[20%]'>
          <h2 className='text-green-600 text-lg sm:text-base'>Phantom Bluggers</h2>
          <p className='text-lg sm:text-sm mt-2'>
            Join Phantom Blugger's growing community of writers and readers. Share your voice, explore diverse topics, and stay inspired by fresh stories every day.
          </p>
        </div>

        {/* Middle Section */}
        <div className='text-white md:ml-[10%] md:w-[60%] mt-4 md:mt-0'>
          <h2 className='text-lg sm:text-base'>Quick Links</h2>
          <div className='text-lg sm:text-sm space-y-1 mt-2'>
            <p><Link to="/">Home</Link></p>
            <p><Link to='/blogs'>Blog</Link></p>
            <p><Link to="/about">About</Link></p>
            <p><Link to="/contact">Contact Us</Link></p>
            <p>FAQ</p>
          </div>
        </div>

        {/* Right Section */}
        <div className='text-white mt-4 md:mt-0'>
          <h2 className='text-lg sm:text-base'>Social Handles</h2>
          <div className='text-2xl flex space-x-4 mt-5 hover:cursor-pointer'>
            <p className='hover:text-3xl hover:text-green-600'><FaFacebook /></p>
            <p className='hover:text-3xl hover:text-green-600'><IoLogoWhatsapp /></p>
            <p className='hover:text-3xl hover:text-green-600'><FaTiktok /></p>
            <p className='hover:text-3xl hover:text-green-600'><BsTwitterX /></p>
          </div>
        </div>

      </div>

      {/* Horizontal Rule */}
      <div className='text-white w-[80%] ml-[10%] mt-7'>
        <hr />
      </div>

      {/* Footer Bottom Line */}
      <h6 className='text-white flex items-center justify-center text-center pb-5 mt-4 text-sm sm:text-xs'>
        copyright &copy; 2025 <FaGripLinesVertical /> Phantom Bluggers <FaGripLinesVertical /> All Rights Reserved
      </h6>

    </div>
  )
}

export default Footer
