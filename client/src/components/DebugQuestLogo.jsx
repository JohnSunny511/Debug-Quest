import React from "react";
import "./DebugQuestLogo.css";

function DebugQuestLogo({
  className = "",
  size = "md",
  variant = "full",
  href,
  title = "Debug Quest",
  tone,
}) {
  const resolvedTone = tone || (variant === "full" ? "light" : "dark");
  const dFill = resolvedTone === "light" ? "#f4f7fb" : "#2f3136";
  const textFill = resolvedTone === "light" ? "#f4f7fb" : "#2f3136";
  const classes = [
    "debug-quest-logo",
    `debug-quest-logo--${size}`,
    `debug-quest-logo--${variant}`,
    `debug-quest-logo--tone-${resolvedTone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className={classes} aria-label={title} role="img">
      <svg
        className="debug-quest-logo__svg"
        viewBox={variant === "mark" ? "0 0 210 160" : "0 0 540 210"}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="dq-q-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8dbe1" />
            <stop offset="100%" stopColor="#aeb5c0" />
          </linearGradient>
        </defs>

        <g transform="translate(0 6)">
          <path
            d="M22 28H150C184 28 210 54 210 88C210 122 184 148 150 148H22V28Z"
            fill={dFill}
          />
          <path
            d="M53 56H148C165 56 178 69 178 86V89C178 106 165 119 148 119H53C48 119 44 115 44 110V65C44 60 48 56 53 56Z"
            fill="#ffffff"
          />
          <path
            d="M53 56H148C165 56 178 69 178 86V89C178 106 165 119 148 119H53C48 119 44 115 44 110V65C44 60 48 56 53 56Z"
            fill="none"
            stroke="#2f3136"
            strokeWidth="4"
          />
          <line x1="45" y1="74" x2="177" y2="74" stroke="#2f3136" strokeWidth="4" />
          <circle cx="59" cy="65" r="4.4" fill="#2f3136" />
          <circle cx="72" cy="65" r="4.4" fill="#2f3136" />
          <circle cx="85" cy="65" r="4.4" fill="#2f3136" />
          <rect x="151" y="61" width="18" height="5" rx="2.5" fill="#2f3136" />
          <ellipse cx="111" cy="95" rx="11" ry="15" fill="#2f3136" />
          <circle cx="106" cy="91" r="2.2" fill="#ffffff" />
          <circle cx="116" cy="91" r="2.2" fill="#ffffff" />
          <line x1="100" y1="82" x2="94" y2="76" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="121" y1="82" x2="127" y2="76" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="98" y1="91" x2="90" y2="89" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="124" y1="91" x2="132" y2="89" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="99" y1="100" x2="92" y2="106" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="123" y1="100" x2="130" y2="106" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="111" y1="109" x2="111" y2="118" stroke="#2f3136" strokeWidth="3.2" strokeLinecap="round" />
          <path
            d="M305 28C339 28 365 54 365 88C365 115 348 137 324 145L356 181H315L289 149H277C243 149 217 123 217 88C217 54 243 28 277 28H305ZM305 56H277C260 56 247 70 247 88C247 106 260 120 277 120H305C322 120 335 106 335 88C335 70 322 56 305 56Z"
            fill="url(#dq-q-gradient)"
          />
        </g>

        {variant === "full" ? (
          <text
            x="12"
            y="196"
            fill={textFill}
            fontFamily="'Avenir Next', 'Montserrat', 'Segoe UI', sans-serif"
            fontSize="43"
            fontWeight="600"
            letterSpacing="7"
          >
            DEBUG QUEST
          </text>
        ) : null}
      </svg>
    </span>
  );

  if (href) {
    return (
      <a className="debug-quest-logo__link" href={href} aria-label={title}>
        {content}
      </a>
    );
  }

  return content;
}

export default DebugQuestLogo;
