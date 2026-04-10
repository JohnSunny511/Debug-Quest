import React, { useLayoutEffect, useRef, useState } from "react";
import DebugQuestLogo from "./DebugQuestLogo";

function PageLoader({ title = "Preparing Debug Quest", subtitle = "Loading your next view..." }) {
  const desktopScale = 0.85;
  const isDesktopScale = typeof window !== "undefined" && window.innerWidth >= 1024;
  const pageRef = useRef(null);
  const [desktopScaleOffset, setDesktopScaleOffset] = useState(0);

  useLayoutEffect(() => {
    const pageNode = pageRef.current;
    if (!pageNode || typeof window === "undefined") return undefined;

    const updateScaleOffset = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setDesktopScaleOffset(0);
        return;
      }

      setDesktopScaleOffset(-(pageNode.offsetHeight * (1 - desktopScale)));
    };

    const frameId = window.requestAnimationFrame(updateScaleOffset);
    const resizeObserver = new ResizeObserver(updateScaleOffset);

    resizeObserver.observe(pageNode);
    window.addEventListener("resize", updateScaleOffset);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScaleOffset);
    };
  }, [desktopScale]);

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: isDesktopScale ? `${100 / desktopScale}vh` : "100vh",
        width: isDesktopScale ? `${100 / desktopScale}%` : "100%",
        transform: isDesktopScale ? `scale(${desktopScale})` : "none",
        transformOrigin: "top left",
        marginBottom: isDesktopScale ? `${desktopScaleOffset}px` : "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "18px",
        background: "linear-gradient(135deg, #061429 0%, #0a2d50 45%, #0c1f39 100%)",
        color: "#f8fafc",
        fontFamily: "'Avenir Next', 'Montserrat', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(100%, 380px)",
          borderRadius: "20px",
          padding: "22px 20px",
          background: "rgba(7, 22, 41, 0.72)",
          border: "1px solid rgba(148, 194, 228, 0.18)",
          boxShadow: "0 18px 46px rgba(2, 8, 18, 0.38)",
          backdropFilter: "blur(12px)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <DebugQuestLogo size="sm" variant="mark" />
          <div>
            <p style={{ margin: 0, color: "#8fe8ff", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Debug Quest
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: "1.18rem", color: "#f8fafc" }}>{title}</h2>
          </div>
        </div>

        <p style={{ margin: "0 0 14px", color: "#c7dff2", lineHeight: 1.6, fontSize: "0.92rem" }}>
          {subtitle}
        </p>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "999px",
                background: dot === 1 ? "#7be3ff" : "rgba(123, 227, 255, 0.45)",
                boxShadow: dot === 1 ? "0 0 18px rgba(123, 227, 255, 0.4)" : "none",
                animation: `loaderPulse 1.2s ease-in-out ${dot * 0.18}s infinite`,
              }}
            />
          ))}
        </div>

        <style>
          {`
            @keyframes loaderPulse {
              0%, 100% { transform: translateY(0); opacity: 0.45; }
              50% { transform: translateY(-4px); opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default PageLoader;
