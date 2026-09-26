# UniMate Client — Web bán hàng

React 19 + Vite. Giao diện cửa hàng cho khách: xem sản phẩm, lọc theo danh mục,
thêm vào giỏ, đặt hàng, quản lý tài khoản. Tiếng Việt, responsive, góc vuông.

Chạy kèm backend ([../backend](../backend)) và trang quản trị ([../admin](../admin))
trong cùng một stack Docker.

## Chạy

Cách nhanh nhất — dựng cả stack (xem [`../backend/README.md`](../backend/README.md)):

```powershell
cd ..\backend
docker compose --env-file .env.docker up -d --build
```

Mở <http://127.0.0.1:8081>. Đăng nhập thử `an@example.com` / `Khach123!`.

Chạy riêng để phát triển:

```powershell
npm install
Copy-Item .env.example .env    # sửa VITE_API_BASE nếu API ở máy khác
npm run dev                    # http://localhost:5174
npm run build                  # đóng gói dist/ để deploy tĩnh
```

| Biến môi trường | Ý nghĩa |
|---|---|
| `VITE_API_BASE` | Địa chỉ API, kèm `/api` |
| `VITE_FILES_BASE` | URL công khai của file media (khớp `S3_PUBLIC_URL` backend) |

Đổi 2 biến này trong `.env.docker` (`CLIENT_API_BASE`, `CLIENT_FILES_BASE`) thì phải
build lại image — biến được nướng vào lúc build.

## Trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Banner khuyến mãi, danh mục, gợi ý hôm nay, ưu đãi |
| `/san-pham`, `/tim-kiem` | Lọc danh mục và thương hiệu, sắp xếp giá, phân trang |
| `/san-pham/:slug` | Ảnh và xem lớn, chọn phân loại, tồn kho thật, đánh giá, hàng liên quan |
| `/gio-hang` | Tăng giảm xoá, mã giảm giá, tạm tính |
| `/thanh-toan` | Địa chỉ, vận chuyển, phương thức thanh toán, chốt đơn |
| `/dat-hang-thanh-cong/:id` | Trang cảm ơn sau khi đặt |
| `/dang-nhap`, `/dang-ky` | Đăng nhập và đăng ký |
| `/tai-khoan/*` | Hồ sơ, đơn mua, sổ địa chỉ, yêu thích |
| `/khuyen-mai` | Xem và kiểm tra mã giảm giá |

Khách chưa đăng nhập vẫn mua được: giỏ lưu theo `session_id` trong trình duyệt và
tự gộp vào tài khoản ngay khi đăng nhập.

## Cấu trúc

```
src/
├── api/client.js      gọi API, định dạng tiền/ngày, quản lý session giỏ
├── auth/              đăng nhập/đăng ký, giữ phiên khi F5
├── cart/              giỏ hàng dùng chung + badge số lượng trên giỏ
├── components/
│   ├── Layout.jsx     header, footer, menu trượt
│   ├── HeroSlider.jsx slide banner trang chủ (ảnh hoặc video)
│   ├── Shop.jsx       thẻ sản phẩm, thanh cuộn ngang, phân trang
│   └── Toast.jsx      thông báo kiểu pill
├── pages/             Home, Shop, ProductDetail, Cart, Checkout, Auth, Account, Promo
└── theme.css          màu thương hiệu và toàn bộ responsive
```

Màu: xanh `#0b3d9e` (nút chính), cam `#f59e0b` (giá sale), đỏ `#dc2626` (giá bán).
Toàn bộ giao diện bo góc 0 — khai báo ở cuối `theme.css` để thắng mọi mặc định của
Bootstrap.

Slide banner viết bằng React thuần: các slide xếp chồng, chuyển bằng `opacity` kèm
`inert` cho slide không hiện nên chấm điểm, nút trước/sau và vòng lặp không bị lệch.
Banner giữ tỉ lệ 16:9 và **dùng chung một media cho mọi màn hình** — không có bản
riêng cho mobile. Nếu media đó là video (mp4/webm) thì nó tự chạy, không tiếng, lặp
lại và không có nút điều khiển; chỉ slide đang hiện được phát, và không tự phát nếu
hệ điều hành bật chế độ giảm chuyển động.

Danh sách endpoint: [`../backend/docs/API.md`](../backend/docs/API.md).
