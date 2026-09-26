import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const bannerHref = (b) => {
  const u = b.link_url || '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return u;
  return '/san-pham';
};

export default function HeroSlider({ slides = [], interval = 5500 }) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const touchX = useRef(null);

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
      className="relative w-full overflow-hidden bg-brand-50"
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/9] w-full">
        {slides.map((s, i) => {
          const to = bannerHref(s);
          const body = (
            <picture>
              {s.mobileUrl ? <source media="(max-width: 767px)" srcSet={s.mobileUrl} /> : null}
              <img
                className="block size-full object-cover"
                src={s.url}
                alt={s.alt_text || s.title || ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                aria-hidden={i !== index}
              />
            </picture>
          );
          return (
            <div
              key={s.id || i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-500 ${i === index ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            >
              {to.startsWith('http')
                ? <a className="block size-full" href={to} target="_blank" rel="noreferrer" tabIndex={i === index ? 0 : -1}>{body}</a>
                : <Link className="block size-full" to={to} tabIndex={i === index ? 0 : -1}>{body}</Link>}
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
