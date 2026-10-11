"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./library.module.css";

// Thumbnails render the preview at a desktop width and scale it down, so a
// card shows the desktop composition rather than a cramped mobile one.
const VIRTUAL_WIDTH = 1280;
const VIRTUAL_HEIGHT = 800;

export function PreviewThumbnail({
  src,
  title,
}: Readonly<{ src: string; title: string }>) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / VIRTUAL_WIDTH);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    // Decorative for keyboard and screen-reader users: the card's title link
    // is the way in, and the item page has the interactive preview.
    <div ref={boxRef} className={styles.thumbnail} inert data-preview-thumbnail>
      {scale === null ? null : (
        <iframe
          className={styles.thumbnailFrame}
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          style={{
            width: VIRTUAL_WIDTH,
            height: VIRTUAL_HEIGHT,
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
