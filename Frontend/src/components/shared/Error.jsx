import React from "react";
import { RefreshCcw } from "lucide-react";

export default function Error({
  message = "Something went wrong while fetching data.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 text-gray-300 bg-gray-950 min-h-[90vh]">
      <div className="bg-red-500/10 border border-red-600/30 rounded-full p-4 mb-4">
        <RefreshCcw className="text-red-400 w-6 h-6" />
      </div>

      <h3 className="text-lg font-semibold mb-2 text-red-400">Fetch Error</h3>
      <p className="text-gray-400 mb-4">{message}</p>

      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-lg border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
      >
        Retry
      </button>
    </div>
  );
}
