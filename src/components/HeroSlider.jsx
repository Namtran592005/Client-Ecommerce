import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'bootstrap';

const bannerHref = (b) => {
  const u = b.link_url || '';
  if (u.startsWith('http')) return u;
  if (u.startsWith('/')) return u;
  return '/san-pham';
};

export default function HeroSlider({ slides = [], interval = 5500 }) {
  const elRef = useRef(null);
  const instRef = useRef(null);
  const total = slides.length;

  useEffect(() => {
    const el = elRef.current;
    if (!el || total < 2) return undefined;
    const inst = new Carousel(el, {
      interval,
      ride: 'carousel',
      wrap: true,
      touch: true,
      pause: false,
      keyboard: true,
    });
    instRef.current = inst;
    return () => {
      inst.dispose();
      instRef.current = null;
    };
  }, [total, interval]);

  if (!total) return null;

  return (
    <section
      id="uniHero"
      ref={elRef}
      className="hero carousel slide"
      data-bs-ride="carousel"
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi"
    >
      {total > 1 && (
        <div className="carousel-indicators">
          {slides.map((s, i) => (
            <button
              key={s.id || i}
              type="button"
              data-bs-target="#uniHero"
              data-bs-slide-to={i}
              className={i === 0 ? 'active' : ''}
              aria-label={`Ảnh ${i + 1}`}
            ></button>
          ))}
        </div>
      )}

      <div className="carousel-inner">
        {slides.map((s, i) => {
          const to = bannerHref(s);
          const body = (
            <picture>
              {s.mobileUrl ? <source media="(max-width: 767.98px)" srcSet={s.mobileUrl} /> : null}
              <img
                className="d-block w-100"
                src={s.url}
                alt={s.alt_text || s.title || ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </picture>
          );
          return (
            <div
              className={`carousel-item${i === 0 ? ' active' : ''}`}
              key={s.id || i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${total}`}
            >
              {to.startsWith('http')
                ? <a className="d-block" href={to} target="_blank" rel="noreferrer">{body}</a>
                : <Link className="d-block" to={to}>{body}</Link>}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button className="carousel-control-prev" type="button" data-bs-target="#uniHero" data-bs-slide="prev">
            <i className="bi bi-chevron-left" aria-hidden="true"></i>
            <span className="visually-hidden">Ảnh trước</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#uniHero" data-bs-slide="next">
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
            <span className="visually-hidden">Ảnh sau</span>
          </button>
        </>
      )}
    </section>
  );
}
