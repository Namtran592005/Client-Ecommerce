import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const reduceMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Phải khớp `animation` trong index.css: .page-in 260ms, .page-out 180ms.
const OUT_MS = 180;

/**
 * Chuyển trang mượt kiểu Facebook: giữ trang cũ và mờ đi trong lúc trang mới
 * mờ dần vào đè lên, nên không thấy khoảng trắng, không hiện khung xương tải,
 * và không có cảm giác nội dung bật ra giữa màn hình.
 *
 * - Dữ liệu chưa về thì người dùng vẫn thấy trang cũ, không thấy spinner.
 * - Lớp mới luôn gắn `key` theo pathname nên animation "in" luôn chạy lại,
 *   không bị React dùng lại animation cũ.
 * - `prefers-reduced-motion`: bỏ hiệu ứng, thay trang ngay lập tức.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const reduce = reduceMotion();

  const [layers, setLayers] = useState(() => [{ id: 0, path: pathname, node: children }]);
  const currentRef = useRef(layers[layers.length - 1]);
  const seqRef = useRef(0);

  // Chuyển pathname trong lúc render: React render lại ngay, không nháy trang cũ.
  if (pathname !== currentRef.current.path) {
    const outgoing = currentRef.current;
    currentRef.current = { id: ++seqRef.current, path: pathname, node: children };
    setLayers([outgoing, currentRef.current]);
  }

  // Gỡ lớp đang mờ đi sau khi hết animation.
  useEffect(() => {
    if (layers.length < 2) return undefined;
    const t = setTimeout(() => setLayers([currentRef.current]), OUT_MS);
    return () => clearTimeout(t);
  }, [layers]);

  // Qua trang khác thì bắt đầu từ trên cùng.
  // Phải dùng 'instant' chứ không phải 'auto': theo đặc tả, 'auto' là để
  // CSS `scroll-behavior` quyết định, mà trang này đặt smooth — nên nó sẽ
  // trượt từ từ và vẫn còn ở giữa trang vài trăm mili giây sau khi đã đổi.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  if (reduce) return children;

  const current = currentRef.current;
  const outgoing = layers.filter((l) => l.id !== current.id);

  return (
    <div className="relative">
      {outgoing.map((l) => (
        <div key={l.id} className="page-out pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
          {l.node}
        </div>
      ))}
      <div className="page-in" key={current.id}>{current.node}</div>
    </div>
  );
}
