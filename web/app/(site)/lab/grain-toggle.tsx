"use client";

import { useEffect, useState } from "react";

export function GrainToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.grain = enabled ? "on" : "off";
  }, [enabled]);

  return (
    <button
      aria-pressed={enabled}
      className="tessli-control"
      onClick={() => setEnabled((current) => !current)}
      type="button"
    >
      Grain {enabled ? "on" : "off"}
    </button>
  );
}
