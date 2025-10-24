import React from "react";

function Contact() {
  return (
    <div className="md:pl-10 grid grid-cols-1 md:grid-cols-2 md:gap-10">
      <form className="shadow-2xl bg-white w-full">
        <div className="p-3 pt-10 space-y-10">
          <input
            type="text"
            className="p-2 outline-1 w-full rounded-lg"
            placeholder="Your Name"
          />
          <input
            type="email"
            className="p-2 outline-1 w-full rounded-lg"
            placeholder="Your Email"
          />
          <textarea
            cols="30"
            rows="10"
            className="p-3 w-full outline-1 rounded-lg"
            placeholder="Your Message"
          ></textarea>
          <button className="bg-green-600 text-white text-xl uppercase font-bold w-30 p-2 rounded-lg hover:cursor-pointer hover:outline-green-700 hover:bg-white hover:outline-2 hover:text-green-600">
            Submit
          </button>
        </div>
      </form>

      <div className="w-[90%] mb-10 md:mt-40 mt-20">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.3837384803287!2d3.3442848737303317!3d6.599140422282336!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b9231a8afe793%3A0x5f297da31d68daec!2sAnchorsoft%20Academy!5e0!3m2!1sen!2sng!4v1753251779491!5m2!1sen!2sng"
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        ></iframe>
      </div>
    </div>
  );
}

export default Contact;
