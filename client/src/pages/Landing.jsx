import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import DebugQuestLogo from "../components/DebugQuestLogo";
import { clearStoredSession, validateStoredSession } from "../utils/authSession";
import "./Landing.css";

function Landing() {
  const landingDesktopScale = 0.7225;
  const isDesktopScale = typeof window !== "undefined" && window.innerWidth >= 1024;
  const landingPageRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [signupErrorMessage, setSignupErrorMessage] = useState("");
  const [signupSuccessMessage, setSignupSuccessMessage] = useState("");
  const [desktopScaleOffset, setDesktopScaleOffset] = useState(0);

  const activePanel =
    location.pathname === "/login"
      ? "login"
      : location.pathname === "/signup"
        ? "signup"
        : "default";

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const hasToken = localStorage.getItem("token");
      if (!hasToken) {
        if (!isMounted) return;
        setToken("");
        setUsername("");
        setRole("");
        return;
      }

      try {
        const isValid = await validateStoredSession();
        if (!isMounted) return;

        if (isValid) {
          setToken(localStorage.getItem("token") || "");
          setUsername(localStorage.getItem("username") || "");
          setRole(localStorage.getItem("role") || "");
          return;
        }

        setToken("");
        setUsername("");
        setRole("");
      } catch (_error) {
        if (!isMounted) return;
        setToken(localStorage.getItem("token") || "");
        setUsername(localStorage.getItem("username") || "");
        setRole(localStorage.getItem("role") || "");
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (activePanel !== "login") {
      setLoginErrorMessage("");
      setIsLoginSubmitting(false);
    }

    if (activePanel !== "signup") {
      setSignupErrorMessage("");
      setSignupSuccessMessage("");
      setIsSignupSubmitting(false);
    }
  }, [activePanel]);

  useLayoutEffect(() => {
    const pageNode = landingPageRef.current;
    if (!pageNode || typeof window === "undefined") return undefined;

    const updateScaleOffset = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setDesktopScaleOffset(0);
        return;
      }

      setDesktopScaleOffset(-(pageNode.offsetHeight * (1 - landingDesktopScale)));
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
  }, [activePanel, landingDesktopScale, loginErrorMessage, role, signupErrorMessage, signupSuccessMessage, token]);

  const completeLogin = (data, fallbackUsername = loginUsername) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username || fallbackUsername);
    if (data.role) {
      localStorage.setItem("role", data.role);
    }

    setToken(data.token);
    setUsername(data.username || fallbackUsername);
    setRole(data.role || "");
    navigate(data.redirectTo || "/challenges");
  };

  const handleTraditionalLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginErrorMessage("Enter both your username and password to continue.");
      return;
    }

    try {
      setIsLoginSubmitting(true);
      setLoginErrorMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: loginUsername.trim(),
        password: loginPassword,
      });

      completeLogin(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials.";
      setLoginErrorMessage(msg);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsLoginSubmitting(true);
      setLoginErrorMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });

      completeLogin(res.data, res.data.username);
    } catch (err) {
      const msg = err.response?.data?.message || "Google login failed.";
      setLoginErrorMessage(msg);
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleSignup = async () => {
    if (!signupUsername.trim() || !signupPassword.trim()) {
      setSignupSuccessMessage("");
      setSignupErrorMessage("Choose a username and password to create your account.");
      return;
    }

    try {
      setIsSignupSubmitting(true);
      setSignupErrorMessage("");
      setSignupSuccessMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        username: signupUsername.trim(),
        password: signupPassword,
      });

      setSignupSuccessMessage(res.data.message || "Account created successfully.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Signup failed.";
      setSignupSuccessMessage("");
      setSignupErrorMessage(msg);
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  return (
    <div
      className="landing-page"
      ref={landingPageRef}
      style={{
        minHeight: isDesktopScale ? `${100 / landingDesktopScale}vh` : "100vh",
        width: isDesktopScale ? `${100 / landingDesktopScale}%` : "100%",
        transform: isDesktopScale ? `scale(${landingDesktopScale})` : "none",
        transformOrigin: "top left",
        marginBottom: isDesktopScale ? `${desktopScaleOffset}px` : "0",
        padding: "16px clamp(10px, 2.4vw, 36px) 24px",
        fontSize: "0.84rem",
      }}
    >
      <div className="landing-ambient" aria-hidden="true">
        <span className="ambient-orb orb-a" />
        <span className="ambient-orb orb-b" />
        <span className="ambient-orb orb-c" />
      </div>

      <div className="landing-page-frame">
        <header className="landing-header">
          <Link className="landing-brand" to="/">
            <DebugQuestLogo size="md" />
          </Link>

          <div className="landing-nav">
            <Link className="nav-link" to="/learn">
              Learn Debugging
            </Link>
            {token ? (
              <>
                <span className="welcome-copy">
                  Welcome{username ? `, ${username}` : ""}
                </span>
                <button
                  type="button"
                  className="nav-cta"
                  onClick={() => navigate("/challenges")}
                >
                  Open Challenges
                </button>
                {role === "admin" && (
                  <button
                    type="button"
                    className="nav-cta nav-admin"
                    onClick={() => navigate("/dashboard/internal")}
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  type="button"
                  className="nav-cta"
                  style={{ backgroundColor: "#ef4444", border: "none", marginLeft: "10px" }}
                  onClick={() => {
                    clearStoredSession();
                    window.location.href = "/login";
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/login">
                  Login
                </Link>
                <Link className="nav-cta" to="/signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="landing-main">
          <section className="hero-copy">
            <p className="hero-eyebrow">Interactive Debugging Arena</p>
            <h1 className="hero-title">
              <span className="hero-title-line hero-title-line-1">
                Level up your debugging
              </span>
              <span className="hero-title-line hero-title-line-2">
                instincts with real coding battles.
              </span>
            </h1>
            <p className="hero-description">
              Debug Quest gives you structured challenge tracks, AI-generated bug
              hunts, live scoring logic, and competitive progress tracking so you
              can practice debugging in a way that feels closer to real
              engineering work.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-primary"
                onClick={() => navigate(token ? "/challenges" : "/login")}
              >
                {token ? "Continue Challenge" : "Start Debugging"}
              </button>
              <button
                type="button"
                className="hero-secondary"
                onClick={() => navigate("/learn")}
              >
                Learn Concepts
              </button>
              <button
                type="button"
                className="hero-secondary"
                onClick={() => navigate("/leaderboard")}
              >
                View Leaderboard
              </button>
              {token && role === "admin" && (
                <button
                  type="button"
                  className="hero-secondary hero-admin"
                  onClick={() => navigate("/dashboard/internal")}
                >
                  Open Admin Dashboard
                </button>
              )}
            </div>

            <div className="hero-metrics">
              <div className="metric-card">
                <strong>Adaptive</strong>
                <span>Challenge Tracks</span>
              </div>
              <div className="metric-card">
                <strong>AI</strong>
                <span>Dynamic Bug Scenarios</span>
              </div>
              <div className="metric-card">
                <strong>Multiple</strong>
                <span>Supported Languages</span>
              </div>
            </div>

            <div className="hero-support-strip">
              <div className="support-chip">Live change tracking</div>
              <div className="support-chip">Hints and guided debugging</div>
              <div className="support-chip">Per-question discussions</div>
              <div className="support-chip">Leaderboard momentum</div>
              {!token && (
                <>
                  <button
                    type="button"
                    className={`support-chip support-chip-action ${activePanel === "login" ? "is-active" : ""}`}
                    onClick={() => navigate("/login")}
                  >
                    Open Login
                  </button>
                  <button
                    type="button"
                    className={`support-chip support-chip-action ${activePanel === "signup" ? "is-active" : ""}`}
                    onClick={() => navigate("/signup")}
                  >
                    Open Signup
                  </button>
                </>
              )}
            </div>
          </section>

          <section className={`hero-visual ${activePanel !== "default" ? "hero-visual-auth" : ""}`}>
            {activePanel === "login" ? (
              <div className="landing-auth-shell">
                <div className="landing-auth-panel">
                  <div className="landing-auth-panel-header">
                    <p className="landing-auth-panel-kicker">Account Access</p>
                    <h2>Sign in to Debug Quest</h2>
                    <p>Use your existing account to jump straight into challenges.</p>
                  </div>

                  <form
                    className="landing-auth-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleTraditionalLogin();
                    }}
                  >
                    <label className="landing-auth-field">
                      <span>Username</span>
                      <input
                        value={loginUsername}
                        onChange={(event) => setLoginUsername(event.target.value)}
                        placeholder="Enter your username"
                        autoComplete="username"
                        disabled={isLoginSubmitting}
                      />
                    </label>

                    <label className="landing-auth-field">
                      <span>Password</span>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        disabled={isLoginSubmitting}
                      />
                    </label>

                    {loginErrorMessage ? (
                      <div className="landing-auth-error" role="alert">
                        {loginErrorMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      className="landing-auth-submit"
                      disabled={isLoginSubmitting}
                    >
                      {isLoginSubmitting ? "Signing In..." : "Login to Continue"}
                    </button>
                  </form>

                  <div className="landing-auth-divider">
                    <span>or continue with</span>
                  </div>

                  <div className="landing-auth-google-wrap">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => setLoginErrorMessage("Google login failed. Please try again.")}
                    />
                  </div>

                  <p className="landing-auth-footer-copy">
                    New to Debug Quest? <Link to="/signup">Create your account</Link>
                  </p>
                </div>
              </div>
            ) : null}

            {activePanel === "signup" ? (
              <div className="landing-auth-shell">
                <div className="landing-auth-panel">
                  <div className="landing-auth-panel-header">
                    <p className="landing-auth-panel-kicker">New Member Setup</p>
                    <h2>Create your Debug Quest account</h2>
                    <p>Pick a username and password to unlock the full challenge experience.</p>
                  </div>

                  <form
                    className="landing-auth-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleSignup();
                    }}
                  >
                    <label className="landing-auth-field">
                      <span>Username</span>
                      <input
                        value={signupUsername}
                        onChange={(event) => setSignupUsername(event.target.value)}
                        placeholder="Choose a username"
                        autoComplete="username"
                        disabled={isSignupSubmitting}
                      />
                    </label>

                    <label className="landing-auth-field">
                      <span>Password</span>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        disabled={isSignupSubmitting}
                      />
                    </label>

                    {signupErrorMessage ? (
                      <div className="landing-auth-error" role="alert">
                        {signupErrorMessage}
                      </div>
                    ) : null}

                    {signupSuccessMessage ? (
                      <div className="landing-auth-success" role="status">
                        {signupSuccessMessage}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      className="landing-auth-submit"
                      disabled={isSignupSubmitting}
                    >
                      {isSignupSubmitting ? "Creating Account..." : "Create Account"}
                    </button>
                  </form>

                  <p className="landing-auth-footer-copy">
                    Already have an account? <Link to="/login">Sign in here</Link>
                  </p>
                </div>
              </div>
            ) : null}

            {activePanel === "default" ? (
              <>
                <div className="terminal-card" aria-hidden="true">
                  <div className="terminal-head">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                    <span className="terminal-title">debug-session.js</span>
                  </div>

                  <div className="terminal-body">
                    <div className="code-line line-1">const score = bugsFixed * speed;</div>
                    <div className="code-line line-2">if (tests.pass()) submit(score);</div>
                    <div className="code-line line-3">leaderboard.update(playerId);</div>
                    <div className="typing-line">run debug-quest --mode ranked</div>
                  </div>
                </div>

                <div className="floating-pill pill-1">Easy to Hard Tracks</div>
                <div className="floating-pill pill-2">Realtime Feedback</div>
                <div className="floating-pill pill-3">Code Like Production</div>
              </>
            ) : null}
          </section>
        </main>

        <section className="feature-strip">
          <article className="feature-card">
            <h3>Progressive Difficulty</h3>
            <p>Start with syntax-level issues and move to logic-heavy breakpoints.</p>
          </article>
          <article className="feature-card">
            <h3>AI Bug Generator</h3>
            <p>Train on fresh bug patterns so you do not memorize one fixed answer.</p>
          </article>
          <article className="feature-card">
            <h3>Competitive Tracking</h3>
            <p>Stay motivated with rankings and improvement milestones per attempt.</p>
          </article>
        </section>

        <section className="workflow-strip">
          <article className="workflow-card">
            <p className="workflow-step">01</p>
            <h3>Pick Your Arena</h3>
            <p>Move through guided difficulty tracks or generate a fresh AI challenge when you want something unpredictable.</p>
          </article>
          <article className="workflow-card">
            <p className="workflow-step">02</p>
            <h3>Debug With Feedback</h3>
            <p>Run code, inspect output, watch live change limits, and use hints only when you need a nudge.</p>
          </article>
          <article className="workflow-card">
            <p className="workflow-step">03</p>
            <h3>Improve In Public</h3>
            <p>Track progress over time, compare with the leaderboard, and learn from question-specific discussion threads.</p>
          </article>
        </section>

      </div>
    </div>
  );
}

export default Landing;
