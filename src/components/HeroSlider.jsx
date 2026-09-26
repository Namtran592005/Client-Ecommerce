import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const bannerHref = (b) => {
  const u = b.link_url || '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return u;
  return '/san-pham';
};

// Mỗi banner dùng chung một media cho mọi màn hình. Nếu media là video thì
// chạy tự động, không tiếng, lặp lại và không có nút điều khiển.
const isVideo = (s) => (s.mime_type || '').startsWith('video/');

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroSlider({ slides = [], interval = 5500 }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const touchX = useRef(null);
  const rootRef = useRef(null);

  const go = useCallback((next) => {
    if (total < 2) return;
    setIndex(((next % total) + total) % total);
  }, [total]);

  useEffect(() => {
    if (total < 2 || !interval) return undefined;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % total), interval);
    return () => clearInterval(timer.current);
  }, [total, interval]);

  useEffect(() => { setIndex(0); }, [total]);

  // Chỉ slide đang hiện được phát; slide khác dừng lại để không tốn băng thông.
  // Người dùng bật "giảm chuyển động" thì không tự phát.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const auto = !prefersReducedMotion();
    root.querySelectorAll('video[data-slide]').forEach((v) => {
      if (Number(v.dataset.slide) === index && auto) {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [index, slides]);

  if (!total) return null;

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    touchX.current = null;
  };

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden bg-brand-50"
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/9] w-full">
        {slides.map((s, i) => {
          const to = bannerHref(s);
          const active = i === index;
          const body = isVideo(s) ? (
            <video
              data-slide={i}
              className="block size-full object-cover"
              src={s.url}
              autoPlay
              muted
              loop
              playsInline
              preload={active ? 'auto' : 'metadata'}
              disablePictureInPicture
              tabIndex={-1}
              aria-hidden="true"
            />
          ) : (
            <img
              className="block size-full object-cover"
              src={s.url}
              alt={s.alt_text || s.title || ''}
              decoding="async"
              fetchPriority={active ? 'high' : 'low'}
            />
          );
          return (
            <div
              key={s.id || i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-500 ${active ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            >
              {to.startsWith('http')
                ? <a className="block size-full" href={to} target="_blank" rel="noreferrer" tabIndex={active ? 0 : -1}>{body}</a>
                : <Link className="block size-full" to={to} tabIndex={active ? 0 : -1}>{body}</Link>}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Ảnh trước"
            className="absolute top-1/2 left-0 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-r-lg text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:left-1 sm:size-10 sm:rounded-full"
          >
            <i className="bi bi-chevron-left text-xl leading-none sm:text-2xl" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Ảnh sau"
            className="absolute top-1/2 right-0 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-l-lg text-white/85 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-1 sm:size-10 sm:rounded-full"
          >
            <i className="bi bi-chevron-right text-xl leading-none sm:text-2xl" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/85'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
