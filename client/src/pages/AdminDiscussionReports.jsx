import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminLogoutButton from "../components/AdminLogoutButton";

const API_BASE = `${API_BASE_URL}/api/dashboard/internal/discussions`;

function AdminDiscussionReports() {
  const desktopScale = 0.85;
  const isDesktopScale = typeof window !== "undefined" && window.innerWidth >= 1024;
  const pageRef = useRef(null);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [desktopScaleOffset, setDesktopScaleOffset] = useState(0);

  const readResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return { message: await response.text() };
  };

  const loadReportedMessages = useCallback(async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/reported`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await readResponseData(response);
      if (!response.ok) {
        throw new Error(data?.message || "Failed to load reported messages.");
      }
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatusMessage(error.message || "Unable to load reported messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportedMessages();
  }, [loadReportedMessages]);

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
  }, [desktopScale, items.length, loading, statusMessage]);

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
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "0.35rem", fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              Discussion Moderation
            </h1>
            <p style={{ margin: 0, color: "#94a3b8" }}>
              Review reported discussion messages and jump into user simulation to moderate them.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={loadReportedMessages}
              disabled={loading}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: loading ? "#475569" : "#2563eb",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>
            <AdminLogoutButton />
          </div>
        </div>

        <div
          style={{
            marginTop: "1.4rem",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
            <button
              type="button"
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "0.55rem 1rem",
                background: "#2563eb",
                color: "white",
                fontWeight: "600",
                cursor: "default",
              }}
            >
              Reported
            </button>
          </div>

          {loading ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>Loading reported messages...</p>
          ) : statusMessage ? (
            <p style={{ margin: 0, color: "#fca5a5" }}>{statusMessage}</p>
          ) : items.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>No reported messages right now.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              {items.map((item) => (
                <div
                  key={item._id}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    padding: "0.9rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.45rem" }}>
                    <strong>{item.question?.title || "Question discussion"}</strong>
                    <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                      {item.reportCount} report{item.reportCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.35rem", color: "#cbd5e1" }}>
                    <strong>User:</strong> {item.authorUsername}
                  </p>
                  <p style={{ margin: "0 0 0.35rem", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                    <strong>Message:</strong> {item.text}
                  </p>
                  <p style={{ margin: "0 0 0.8rem", color: "#94a3b8" }}>
                    <strong>Reported By:</strong> {item.reportedBy?.join(", ") || "Unknown"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/${item.question?.level}/${item.question?.id}?highlightMessage=${item._id}&adminReview=1`
                      )
                    }
                    style={{
                      border: "none",
                      borderRadius: "8px",
                      padding: "0.55rem 0.9rem",
                      background: "#0f766e",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Open In User Simulation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDiscussionReports;
