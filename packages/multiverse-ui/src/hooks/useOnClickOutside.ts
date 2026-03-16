import { useEffect, useRef } from "react";

const useOnOutsideClick = (callback: () => void) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(event.target)) return;
      callback();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callback]);

  return { ref };
};

export default useOnOutsideClick;
