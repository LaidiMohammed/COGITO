import { useEffect, useRef, useState } from "react";
import "./CustomCursor.css";

const CustomCursor = () => {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      ring.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
    };

    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      dotPos.current.x = lerp(dotPos.current.x, pos.current.x, 0.18);
      dotPos.current.y = lerp(dotPos.current.y, pos.current.y, 0.18);
      dot.style.transform = `translate(${dotPos.current.x - 4}px, ${dotPos.current.y - 4}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onOver = (e) => {
      const t = e.target;
      const interactive =
        t.tagName === "BUTTON" || t.tagName === "A" ||
        t.tagName === "INPUT" || t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" || t.tagName === "LABEL" ||
        t.closest("button") || t.closest("a") ||
        t.getAttribute("role") === "button";
      setIsHovering(!!interactive);
    };
    const onDown = () => setIsClicking(true);
    const onUp = () => setIsClicking(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className={[
          "cc-ring",
          isHovering ? "cc-hover" : "",
          isClicking ? "cc-click" : "",
        ].join(" ")}
      />
      <div
        ref={dotRef}
        className={["cc-dot", isHovering ? "cc-hover" : ""].join(" ")}
      />
    </>
  );
};

export default CustomCursor;
