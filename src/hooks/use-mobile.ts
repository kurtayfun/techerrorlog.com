import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    
    const handleInit = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    // Defer execution to clear synchronous effect lint rules
    const frameId = requestAnimationFrame(handleInit);

    return () => {
      mql.removeEventListener("change", onChange);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return isMobile;
}
