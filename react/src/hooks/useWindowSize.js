import { useState, useEffect } from "react";

export const useWindowSize = () => {
   const [windowSize, setWindowSize] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 1024,
      height: typeof window !== 'undefined' ? window.innerHeight : 768,
   });

   useEffect(() => {
      const handleResize = () => {
         setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
         });
      };

      if (typeof window !== 'undefined') {
         window.addEventListener("resize", handleResize);
         handleResize();
      }

      return () => {
         if (typeof window !== 'undefined') {
            window.removeEventListener("resize", handleResize);
         }
      };
   }, []);

   return windowSize;
};
