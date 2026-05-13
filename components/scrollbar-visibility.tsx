"use client";

import { useEffect } from "react";

export function ScrollbarVisibility() {
  useEffect(() => {
    let timeoutId: number | undefined;

    const setVisible = () => {
      document.documentElement.dataset.scrollbarVisible = "true";

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        delete document.documentElement.dataset.scrollbarVisible;
      }, 360);
    };

    const handleScroll = () => {
      setVisible();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      delete document.documentElement.dataset.scrollbarVisible;
    };
  }, []);

  return null;
}