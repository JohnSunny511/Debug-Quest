import React from "react";
import { Link } from "react-router-dom";

function RuntimeNote() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "clamp(20px, 4vw, 40px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
