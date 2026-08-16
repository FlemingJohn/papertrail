export function installOverlay() {
  if (document.getElementById("papertrailCursor") !== null) {
    return;
  }

  const cursor = document.createElement("div");
  cursor.id = "papertrailCursor";
  cursor.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:26px",
    "height:26px",
    "margin-left:-3px",
    "margin-top:-3px",
    "pointer-events:none",
    "z-index:2147483647",
    "transition:scale 90ms ease-out",
    "will-change:translate",
  ].join(";");

  cursor.innerHTML = [
    '<svg width="26" height="26" viewBox="0 0 26 26" fill="none">',
    '<path d="M4 2 L4 20 L9 15.5 L12.5 23 L16 21.4 L12.6 14.2 L19 14 Z"',
    ' fill="#ffffff" stroke="#0b0b0b" stroke-width="1.4" stroke-linejoin="round"/>',
    "</svg>",
  ].join("");

  document.body.appendChild(cursor);

  const ring = document.createElement("div");
  ring.id = "papertrailRing";
  ring.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:38px",
    "height:38px",
    "margin-left:-19px",
    "margin-top:-19px",
    "border-radius:50%",
    "border:2px solid rgba(37,110,235,0.9)",
    "pointer-events:none",
    "z-index:2147483646",
    "opacity:0",
    "will-change:translate,scale,opacity",
  ].join(";");

  document.body.appendChild(ring);

  const step = document.createElement("div");
  step.id = "papertrailStep";
  step.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:38px",
    "translate:-50% 0",
    "padding:11px 22px",
    "background:rgba(10,10,10,0.92)",
    "border:1px solid rgba(255,255,255,0.16)",
    "backdrop-filter:blur(8px)",
    "color:#fafafa",
    "font-family:ui-monospace,'Cascadia Mono',Menlo,monospace",
    "font-size:13px",
    "letter-spacing:0.22em",
    "text-transform:uppercase",
    "pointer-events:none",
    "z-index:2147483647",
    "opacity:0",
    "transition:opacity 320ms ease",
  ].join(";");

  document.body.appendChild(step);

  window.__papertrailCursorMove = (x, y) => {
    cursor.style.translate = `${x}px ${y}px`;
    ring.style.translate = `${x}px ${y}px`;
  };

  window.__papertrailCursorPress = (isDown) => {
    cursor.style.scale = isDown ? "0.82" : "1";

    if (!isDown) {
      return;
    }

    ring.animate(
      [
        { opacity: 0.85, scale: "0.45" },
        { opacity: 0, scale: "1.25" },
      ],
      { duration: 520, easing: "cubic-bezier(0.16,1,0.3,1)" }
    );
  };

  window.__papertrailSetStep = (text) => {
    if (text === null || text === "") {
      step.style.opacity = "0";
      return;
    }

    step.textContent = text;
    step.style.opacity = "1";
  };

  window.__papertrailRevealPassword = () => {
    const field = document.getElementById("password");

    if (field !== null) {
      field.setAttribute("type", "text");
    }
  };
}
