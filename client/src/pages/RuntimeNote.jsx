import React, { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

function RuntimeNote() {
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
    <main
      ref={pageRef}
      style={{
        minHeight: isDesktopScale ? `${100 / desktopScale}vh` : "100vh",
        width: isDesktopScale ? `${100 / desktopScale}%` : "100%",
        transform: isDesktopScale ? `scale(${desktopScale})` : "none",
        transformOrigin: "top left",
        marginBottom: isDesktopScale ? `${desktopScaleOffset}px` : "0",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "clamp(12px, 2.8vw, 24px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "0.84rem",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <Link to="/" style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}>
          Back to home
        </Link>

        <div
          style={{
            marginTop: "1rem",
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: "18px",
            padding: "clamp(20px, 4vw, 32px)",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.35)",
          }}
        >
          <p style={{ margin: 0, color: "#38bdf8", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Runtime Note
          </p>
          <h1 style={{ margin: "0.8rem 0 1rem", color: "#f8fafc", fontSize: "clamp(1.9rem, 4vw, 2.6rem)" }}>
            Why the compiler or RAG bot may not work
          </h1>
          <p style={{ margin: 0, lineHeight: 1.75, color: "#cbd5e1" }}>
            This project needs extra Docker container services to be running. If those containers are down,
            code execution and the RAG chatbot will not work, even if the website itself opens correctly.
          </p>

          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ color: "#f8fafc", marginBottom: "0.75rem" }}>For full local functionality</h2>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.8, color: "#cbd5e1" }}>
              <li>Start `docker-compose.yaml`.</li>
              <li>Wait for the Piston installer to finish.</li>
              <li>Make sure the RAG microservice is available.</li>
              <li>Run the frontend and backend application layers.</li>
              <li>Point the backend environment to the locally running Piston API.</li>
            </ul>
          </section>

          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ color: "#f8fafc", marginBottom: "0.75rem" }}>For hosted use</h2>
            <p style={{ margin: 0, lineHeight: 1.75, color: "#cbd5e1" }}>
              The hosted app can serve the website, but full compiler and chatbot support still depend on the
              maintainer's container services and private bridge script being active.
            </p>
          </section>

          <section style={{ marginTop: "1.5rem" }}>
            <h2 style={{ color: "#f8fafc", marginBottom: "0.75rem" }}>Repository note</h2>
            <p style={{ margin: 0, lineHeight: 1.75, color: "#cbd5e1" }}>
              This page is a readable version of the Runtime Note from the project README so testers can understand
              the limitation without seeing internal service URLs.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export default RuntimeNote;
