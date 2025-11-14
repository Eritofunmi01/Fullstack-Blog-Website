import React from "react";
import { motion } from "framer-motion";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 min-h-[40vh]">
      {/* Spinner */}
      <motion.div
        className="w-12 h-12 border-4 border-gray-800 border-t-green-500 rounded-full mb-6"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      {/* Text shimmer */}
      <motion.p
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-sm tracking-wide"
      >
        {message}
      </motion.p>

      {/* Skeleton shimmer effect */}
      <div className="mt-8 w-11/12 max-w-3xl space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-800 rounded-xl h-24 w-full"
          />
        ))}
      </div>
    </div>
  );
}
