import { useEffect } from "react";

export default function useInactivity(timeout = 5 * 60 * 1000, onTimeout) {
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onTimeout, timeout);
    };

    // Listen for user activity
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    resetTimer(); // start initial timer

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [timeout, onTimeout]);
}
