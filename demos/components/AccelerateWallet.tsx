import { useEffect, useRef } from "react";

export const AccelerateWallet = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current?.children?.length === 0) {
      window.accelerate.openWallet();
    }
    return () => {
      try {
        // Disabled lint: It's okay if the ref changes by the time cleanup runs; we are actually onlly
        // interested in checking the state of the real DOM at exit time
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (containerRef.current?.children && containerRef.current?.children?.length > 0) {
          window.accelerate.closeWallet();
        }
      } catch (error) {
        console.log("Issue closing wallet", error);
      }
    };
  }, []);
  return <div ref={containerRef} id="accelerate-wallet"></div>;
};
