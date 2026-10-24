# Thiết kế giao diện TV — bản xem trước

Áp dụng hai skill ui-ux-pro-max và ui-ux-designer theo yêu cầu của chủ sở hữu. Đã chạy script design-system của skill với ngữ cảnh smart TV / entertainment / cinematic / living room / dark glass và tra hướng dẫn React về quản lý focus, truy vấn accessibility và controlled state.

## Hướng thiết kế
Bố cục toàn màn hình với phong cảnh núi chiều tối vẽ riêng bằng SVG cục bộ. Chữ lớn bên trái; ba ô ứng dụng nằm ngang phía dưới; thanh điều hướng dạng kính nhỏ ở trên. Màu xanh rừng/than, trắng ngà và các màu nhận diện tiết chế. Giao diện tập trung vào VTVgo, YouTube và Netflix, không chèn nội dung phim, lịch sử xem, trạng thái cài đặt hoặc số liệu thiết bị giả.

Kết quả tra skill gợi ý Liquid Glass; những phần analytics, cá nhân hóa bằng dữ liệu và font CDN trong gợi ý không phù hợp dự án nên không áp dụng. Không thu thập dữ liệu, không dùng tài nguyên mạng khi vận hành.

Màn hình độc lập mở ở `http://127.0.0.1:5173/?preview=tv`. Không mount App dashboard ở chế độ preview, không gọi API backend hoặc ADB.

## Tương tác
- Chọn các ô bằng chuột, Tab hoặc mũi tên trái/phải; Home/End đi tới ô đầu/cuối.
- Ô được focus có viền rõ và trạng thái aria-pressed.
- Enter/click mở hộp thông tin có nhãn rõ là bản thiết kế, không giả lập việc mở ứng dụng TV.
- Escape đóng hộp; focus được giữ trong hộp và trả lại nút ban đầu sau khi đóng.
- Nút Cài đặt chỉ giải thích bản thiết kế, không sửa TV.
- Mobile xếp một cột; chữ nội dung 16px; reduced motion được tôn trọng.

## Phạm vi
Chủ sở hữu đã xác nhận mục tiêu là **dashboard laptop, phong cách giao diện TV**. Thiết kế mới đã được tích hợp làm trang Tổng quan mặc định ở `http://127.0.0.1:5173/`. Các trang Kết nối, Thông tin thiết bị và Ứng dụng có cùng thanh điều hướng ngang và màu nền xanh tối. Không cài APK, đổi launcher hoặc tắt Google TV Home.

Ba ô ứng dụng ở Tổng quan hiển thị trạng thái từ Inventory của phiên đang xác nhận. Chưa quét thì ghi Chưa quét; không thấy package trong lần quét thì báo rõ. Chọn ô chuyển tới trang Ứng dụng, không mở app trên TV. Điều hướng giữ nguyên state React của phiên, không xác nhận thiết bị tự động. READ ONLY và trạng thái kết nối vẫn hiện ở đầu trang; lỗi backend được hiển thị ngay cả ở trang Tổng quan.

Route `?preview=tv` vẫn dùng để xem thiết kế độc lập, không gọi backend. Route mặc định là dashboard thực với API chỉ đọc hiện có.

## Kiểm tra
`node scripts/tv-preview-smoke.mjs` mở Chromium với mọi request API bị chặn; kiểm tra ba ô ứng dụng, ArrowLeft/Right, Home/End, Enter mở hộp thông tin, Tab giữ focus, Escape trả focus, reduced motion, và không tràn ngang ở 375/768/1024/1440/1920px. Bố cục 1920×1080 phải vừa chiều cao màn hình. Ảnh ở reports/tv-home-375.png, tv-home-1440.png, tv-home-1920.png. Không test TV thật trong tác vụ thiết kế này.

Theo quy trình dự án, chạy typecheck, lint, Vitest và build trước bàn giao. Luồng kết nối và mọi bất biến an toàn của backend được giữ nguyên.

Kết quả: typecheck và lint đạt; Vitest 59/59 đạt; kiểm tra preview browser đạt cả năm kích thước, điều hướng phím và dialog. Bố cục 1920×1080 đã được chỉnh để không cuộn dọc. Tất cả kiểm tra chức năng dùng mock hoặc chặn API; không có kiểm tra hay thay đổi TV thật trong tác vụ này.

`npm.cmd run test:ui` kiểm tra dashboard thực với API mock: ba ô ở trang chính; breakpoint 375/768/1024/1440px không tràn ngang; kết nối, chọn/xác nhận; quét package; trạng thái Netflix đã tắt trong fixture được giữ khi quay lại Tổng quan; chọn VTVgo chuyển tới trang Ứng dụng; danh sách kỹ thuật có thể mở, tìm và thu gọn; READ ONLY luôn hiện. Ảnh ở reports/dashboard-tv-desktop.png và reports/dashboard-tv-mobile.png. Không dùng số liệu fixture để khẳng định trạng thái TV thật.
