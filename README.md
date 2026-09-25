# UniMate Client — Web Bán Hàng Cho Khách

![UniMate](public/logo-light.png)

Giao diện cửa hàng online cho khách mua sắm, dựng theo **đúng design system mẫu gốc**
(`client/template/*.html`): header xanh + drawer + lightbox tìm kiếm, banner slider,
danh mục cuộn ngang, thẻ sản phẩm, sidebar lọc + slider giá, trang chi tiết
(gallery, tabs, sticky mua nhanh mobile), footer — chỉ đổi màu đỏ `#80001c`
sang **xanh logo** (`#0b3d9e`). Slide trang chủ lấy ảnh thật từ banner admin
(slide chỉ nhận banner đang bật **và có ảnh**, sắp theo thứ tự admin đặt; nếu không
còn banner nào thì ẩn luôn khối slide thay vì hiện ô màu trống), catalog nhỏ 8 ô/hàng,
tiêu đề trang theo đúng tên danh mục đang xem, bấm ảnh sản phẩm ra thẳng chi tiết.
Tiếng Việt, responsive đầy đủ.

## Có gì cho khách

| Trang | Chức năng |
|---|---|
| Trang chủ `/` | Banner sale (tự chạy, có nút trước/sau), danh mục, gợi ý hôm nay, ưu đãi |
| Sản phẩm `/san-pham`, `/tim-kiem` | Lọc danh mục/thương hiệu, tìm kiếm, sắp xếp giá, phân trang |
| Chi tiết `/san-pham/:slug` | Ảnh + zoom, chọn phân loại (màu/size), tồn thật, đánh giá + viết đánh giá, hàng liên quan |
| Giỏ hàng `/gio-hang` | Tăng/giảm/xóa, thử mã giảm giá, tạm tính real-time (khách vãng lai vẫn mua được) |
| Đặt hàng `/thanh-toan` | Địa chỉ (tự điền nếu đã lưu), ship, COD/chuyển khoản/ví, chốt đơn |
| Tài khoản `/dang-nhap`, `/dang-ky` | Đăng ký/đăng nhập, tự giữ phiên khi F5 |
| Tài khoản `/tai-khoan/*` | Hồ sơ, đơn mua + hủy đơn, sổ địa chỉ, yêu thích |
| Khuyến mãi `/khuyen-mai` | Xem + chép mã, kiểm tra mã |

## Chạy
```powershell
npm install
Copy-Item .env.example .env   # sửa VITE_API_BASE nếu API ở máy khác
npm run dev                   # mở http://localhost:5174
npm run build                 # đóng gói dist/ để deploy tĩnh
```
Mặc định gọi API Docker local (`http://127.0.0.1:3000/api`, đã cho phép CORS).

Triển khai cùng stack Docker có sẵn (`CLIENT_DOMAIN`, `CLIENT_API_BASE`,
`CLIENT_FILES_BASE` trong `backend/.env.docker` → `up -d --build client`).
Test nội bộ: http://127.0.0.1:8081. Đổi API base phải build lại image.

## Cấu trúc (cho dev bảo trì)
```
src/
├── api/client.js   # gọi API, tiền/ngày tiếng Việt, giỏ vãng lai (session_id)
├── auth/           # đăng nhập/đăng ký, giữ phiên khi F5
├── cart/           # giỏ hàng dùng chung + badge số lượng
├── components/     # Layout.jsx (header/footer/nav mobile), Shop.jsx (thẻ SP, phân trang),
│                   # HeroSlider.jsx (slide banner), Toast.jsx (thông báo kiểu pill tối)
├── pages/          # Home, Shop, ProductDetail, Cart, Checkout,
│                   # Auth (login/register), Account (5 tab), Promo
└── theme.css       # màu thương hiệu xanh logo (#0b3d9e) + cam (#f59e0b), responsive
```
Slide banner ở `components/HeroSlider.jsx` dùng **Carousel chuẩn của Bootstrap** (đúng cấu trúc
`.carousel > .carousel-inner > .carousel-item`, nút điều khiển và chấm điểm dùng `data-bs-*`).
React chỉ tạo/huỷ đúng một instance `Carousel` theo vòng đời component và **không tự cập nhật
class `active`** — Bootstrap tự lo, nên chấm điểm, nút trước/sau và vòng lặp không bị lệch.
Banner luôn giữ tỉ lệ **16:9**; dùng `<picture>` để đổi sang ảnh `mobile_image_media_id`
mà admin chọn trên màn hình nhỏ, nhờ vậy chữ trên banner không bị cắt ở điện thoại.
API backend xem tại `backend/docs/API.md`.
