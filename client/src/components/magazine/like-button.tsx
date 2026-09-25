// client/src/components/like-button.tsx
import React, { useState } from "react";

export function LikeButton({ id, initial }: { id: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [locked, setLocked] = useState(!!localStorage.getItem(`liked_${id}`));

  async function like() {
    if (locked) return;
    const r = await fetch(`/api/submissions/${id}/like`, { method: "POST" });
    if (r.ok) {
      const { likes } = await r.json();
      setCount(likes);
      setLocked(true);
      localStorage.setItem(`liked_${id}`, "1");
    }
  }

  return (
    <button onClick={like} disabled={locked}
      style={{ border: "1px solid #e5e7eb", padding: "6px 10px", borderRadius: 8, background: locked ? "#f3f4f6" : "#fff" }}>
      ♥ {count}
    </button>
  );
}