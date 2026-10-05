import { useEffect, useState } from "react";
import logo from "@/assets/logo-light.png";

/** Full-screen launch animation shown on app start, then removed. */
export function LaunchScreen() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2300);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="splash" aria-hidden="true">
      <div className="flex flex-col items-center">
        <img src={logo} alt="" className="splash-logo" />
        <p className="splash-title">AXChess</p>
      </div>
    </div>
  );
}
