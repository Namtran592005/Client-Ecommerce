import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

/**
 * Ảnh tải trễ thật sự, KHÔNG dùng thuộc tính loading="lazy".
 *
 * Lý do: Chrome ghi cảnh báo vào console
 *   "[Intervention] Images loaded lazily and replaced with placeholders."
 * cho mọi ảnh có loading="lazy" trong trang, kể cả ảnh nằm ngoài khung nhìn.
 * Nếu muốn console sạch thì không được dùng thuộc tính đó.
 *
 * Cách ở đây: chỉ gắn src khi ảnh sắp lọt vào khung nhìn (IntersectionObserver),
 * nên vẫn giữ được lợi ích tải trễ mà không sinh cảnh báo.
 */
export default function LazyImg({
  src, alt = '', className, eager = false, rootMargin = '300px 0px', onLoad, ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager || !src);

  useEffect(() => {
    if (visible || !src) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    // Không hỗ trợ IntersectionObserver thì nạp luôn cho chắc.
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, src, rootMargin]);

  return (
    <img
      ref={ref}
      {...(visible && src ? { src } : {})}
      alt={alt}
      className={cn(className)}
      decoding="async"
      onLoad={onLoad}
      {...rest}
    />
  );
}
