"use client";

import { useRef, useState } from "react";
import styles from "./photo-carousel.module.css";

export default function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const touchStartX = useRef<number | null>(null);

  function moveTo(index: number) {
    const next = Math.max(0, Math.min(index, photos.length - 1));
    if (next === current) return;
    setDirection(next > current ? "next" : "previous");
    setCurrent(next);
  }

  return (
    <section
      className={`photo-carousel ${styles.carousel}`}
      style={{
        width: "100%",
        height: "auto",
        minHeight: 0,
        maxHeight: "none",
        aspectRatio: "1 / 1"
      }}
      aria-label={`${alt} 사진 갤러리`}
    >
      <div
        className={styles.viewport}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") moveTo(current - 1);
          if (event.key === "ArrowRight") moveTo(current + 1);
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start === null || end === undefined || Math.abs(start - end) < 45) return;
          moveTo(start > end ? current + 1 : current - 1);
        }}
      >
        <div className={`${styles.slide} ${direction === "next" ? styles.slideNext : styles.slidePrevious}`} key={`${photos[current]}-${current}`}>
          <img className={styles.image} src={photos[current]} alt={`${alt} 실물 사진 ${current + 1}`} />
        </div>
      </div>
      {photos.length > 1 && (
        <>
          <button className={styles.arrow + " " + styles.previous} type="button" onClick={() => moveTo(current - 1)} disabled={current === 0} aria-label="이전 사진">←</button>
          <button className={styles.arrow + " " + styles.next} type="button" onClick={() => moveTo(current + 1)} disabled={current === photos.length - 1} aria-label="다음 사진">→</button>
          <div className={styles.dots} aria-label="사진 선택">
            {photos.map((_, index) => (
              <button key={index} type="button" className={index === current ? styles.activeDot : ""} onClick={() => moveTo(index)} aria-label={`${index + 1}번 사진`} aria-current={index === current ? "true" : undefined} />
            ))}
          </div>
          <span className={styles.count} aria-live="polite">{current + 1} / {photos.length}</span>
        </>
      )}
    </section>
  );
}
