import React from 'react';
import { Link } from 'react-router';

export default function AboutPage() {
  return (
    <div >
      <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">About Us</h1>
      <p className="text-xl text-gray-700 mb-4">
        Hi! We're Phantom Bluggers, the creator of this blog. We're passionate about technology,
        writing, and building meaningful digital experiences. We started this blog to share
        insights, tutorials, and inspiration with others who enjoy learning and growing.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">What You’ll Find Here</h2>
      <ul className="list-disc pl-6 text-gray-700 mb-6">
        <li>Articles on web development, design, and productivity</li>
        <li>Tips on learning new technologies and tools</li>
        <li>Personal thoughts, book reviews, and tech experiments</li>
      </ul>
      </div>
      
      


      <div className=' md:pl-10 grid grid-cols-1 md:grid-cols-2 md:gap-10 '>
        <form action="" className='shadow-2xl bg-#fff w-[100%]'>
            <div className='p-3 pt-10 space-y-10 '>
              <h2>Contact Us </h2>
                <input type="text" className='p-2 outline-1 w-full rounded-lg' placeholder='Your Name' />
                <input type="email" className='p-2 outline-1 w-full rounded-lg' placeholder='Your Email' />
                <textarea name="" id="" cols="30" rows="10" className='p-3 w-full outline-1 rounded-lg' placeholder='Your Message'></textarea>
                <button className='bg-green-600 text-white text-xl uppercase font-bold w-30 p-2 rounded-lg hover:cursor-pointer hover:outline-green-700 hover:bg-white hover:outline-2 hover:text-green-600'>Submit</button>
            </div>
        </form>
        <div className='w-[90%] mb-10 md:mt-40 mt-20'>
          <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.3837384803287!2d3.3442848737303317!3d6.599140422282336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b9231a8afe793%3A0x5f297da31d68daec!2sAnchorsoft%20Academy!5e0!3m2!1sen!2sng!4v1753251779491!5m2!1sen!2sng"
           className='w-full h-full'
           style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" ></iframe>
        </div>
    </div>

    </div>
  );
}
