import React, { useState, useEffect } from "react";

const slides = [
  {
    text: "Knowledge is the fire that lights the future.",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  },
  {
    text: "Ideas become powerful when shared with the world.",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  },
  {
    text: "Your growth today shapes tomorrow’s possibilities.",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
  },
];

function Carousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[55vh] md:h-[80vh] pt-20 pb-7 bg-gradient-to-r from-gray-950 to-gray-950 flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center px-6 md:px-12">
        {/* Text Section */}
        <div
          key={current + "-text"}
          className="transition-opacity duration-700 ease-in-out"
        >
          <h2 className="text-2xl md:text-4xl font-extrabold text-green-500 mb-3 tracking-wide leading-snug font-[Playfair_Display] drop-shadow-lg">
            {slides[current].text}
          </h2>
          <p className="text-gray-300 hidden md:block text-lg font-light italic">
            Inspiring stories, powerful ideas, and growth for tomorrow.
          </p>
        </div>

        {/* Image Section */}
<div
  key={current + "-image"}
  className="transition-all duration-700 ease-in-out rounded-3xl overflow-hidden shadow-xl shadow-green-900/40"
>
  <img
    src={slides[current].image}
    alt="Carousel"
    className="w-full h-[200px] md:h-[300px] object-cover"
  />
</div>

      </div>
    </div>
  );
}

export default Carousel;
