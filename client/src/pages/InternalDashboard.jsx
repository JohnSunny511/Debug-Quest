import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogoutButton from "../components/AdminLogoutButton";

function InternalDashboard() {
  const desktopScale = 0.85;
  const isDesktopScale = typeof window !== "undefined" && window.innerWidth >= 1024;
  const pageRef = useRef(null);
  const [desktopScaleOffset, setDesktopScaleOffset] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Internal Dashboard";
  }, []);

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

  const cardStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "1.25rem",
    width: "min(100%, 280px)",
    flex: "1 1 260px",
    color: "#f8fafc",
    textAlign: "left",
  };

  return (
    <div
      ref={pageRef}
      style={{
        minHeight: isDesktopScale ? `${100 / desktopScale}vh` : "100vh",
        width: isDesktopScale ? `${100 / desktopScale}%` : "100%",
        transform: isDesktopScale ? `scale(${desktopScale})` : "none",
        transformOrigin: "top left",
        marginBottom: isDesktopScale ? `${desktopScaleOffset}px` : "0",
        background: "#020617",
        color: "#f8fafc",
        padding: "clamp(10px, 2.6vw, 20px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "0.84rem",
      }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginTop: 0, fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>Internal Dashboard</h1>
            <p style={{ color: "#94a3b8", maxWidth: "640px" }}>
              Restricted admin workspace for internal content and chatbot controls.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Question Manager</h2>
            <p style={{ color: "#cbd5e1" }}>Create and remove internal challenge content.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/internal/questions")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Chatbot Settings</h2>
            <p style={{ color: "#cbd5e1" }}>Manage internal chatbot documents and memory.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/internal/chatbot")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>User View Simulation</h2>
            <p style={{ color: "#cbd5e1" }}>
              Jump into the regular user interface to verify content, challenge flow, and applied changes.
            </p>
            <button
              type="button"
              onClick={() => navigate("/challenges")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#0f766e",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open User Experience
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Discussion Reports</h2>
            <p style={{ color: "#cbd5e1" }}>
              Review reported problem discussions and jump directly into the related question page for moderation.
            </p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/internal/discussions")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#7c3aed",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternalDashboard;
