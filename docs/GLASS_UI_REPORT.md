# Giao diện kính mờ — 23/10/2026

## Đã thay đổi
Dashboard lấy cảm hứng từ Liquid Glass: nền chuyển sắc cục bộ, lớp kính bán trong suốt có backdrop blur, viền phản sáng nhẹ, góc bo lớn, sidebar nổi, nút và trạng thái có tương phản rõ. Không dùng font, ảnh hoặc CDN bên ngoài. Có fallback nền đặc khi trình duyệt không hỗ trợ blur; hỗ trợ reduced motion và chế độ tăng tương phản.

Trang Tổng quan và Ứng dụng tập trung vào VTVgo, YouTube và Netflix. Ba ứng dụng được cấu hình tại `packages/frontend/src/data/curated-apps.json`, mỗi mục có URL Google Play và ngày đối chiếu. Tên và mô tả tiếng Việt nằm trong vi.json. Không suy đoán tên từ package. Biểu tượng là hình đồ họa minh họa cục bộ, không tuyên bố là logo chính thức.

Chưa quét thì ghi “Chưa quét”; sau quét, trạng thái dựa vào dữ liệu thiết bị. Không tìm thấy package thì ghi rõ không thấy trong lần quét. Danh sách kỹ thuật đầy đủ vẫn có thể mở, tìm kiếm và lọc; mặc định thu gọn để giao diện chính chỉ tập trung ba ứng dụng.

Không thêm API hoặc lệnh ADB, không thay đổi quy trình xác minh danh tính và không tự chọn TV. Đây là dashboard Windows trong trình duyệt, không thay launcher hoặc giao diện trên màn hình TV.

## Yêu cầu gỡ ứng dụng
Chủ sở hữu muốn cả đổi giao diện và chỉ giữ ba ứng dụng trên TV. Phần giao diện đã thực hiện. Phần gỡ **chưa thực hiện** vì AGENTS.md hiện vẫn cấm pm uninstall. Không hứa rằng TV hiện chỉ còn ba ứng dụng, và không tắt dịch vụ hệ thống để đạt mục tiêu đó.

## Xác minh
- Chạy `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` theo quy trình dự án.
- Kiểm tra trình duyệt bằng `npm.cmd run test:ui`: Playwright trên Chromium, desktop 1440px và mobile 390px. Mọi `/api/` đều bị chặn và trả mock; không gọi ADB, không chạm TV thật.
- Luồng kiểm tra: hiển thị đúng ba ứng dụng/chưa quét; READ ONLY hiện rõ; quét/chọn/xác nhận TV mock; trạng thái bật/tắt từ package mock; danh sách đầy đủ mặc định ẩn; mở, tìm Netflix, thu gọn; mobile không tràn ngang; reduced motion tắt transition; không lỗi JavaScript.
- Ảnh kiểm tra lưu ở `reports/glass-desktop.png` và `reports/glass-mobile.png`. Ảnh trang Tổng quan ở trạng thái chưa kết nối, không dùng số liệu thiết bị giả để trang trí.
- Không kiểm tra lại danh sách package trên TV thật trong lần đổi UI này. Không thực thi thay đổi TV.

Vite ban đầu gặp lỗi quyền đọc thư mục cha ở bước optimize dependency trong sandbox. Đã chạy lại bước optimize và máy chủ phát triển với quyền đọc thông thường; sau khi khởi động lại, kiểm tra browser hoạt động. React StrictMode hủy bootstrap đầu khi remount là hành vi dự kiến; UI smoke chỉ bỏ qua abort chính xác này, vẫn bắt lỗi JS và request khác.

## Chạy lại kiểm tra trình duyệt
Máy chủ `npm.cmd run dev` phải đang chạy tại 127.0.0.1:5173. Lần đầu chuẩn bị trình duyệt test trong workspace:
```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.browser-cache'
npx.cmd playwright install chromium
npm.cmd run test:ui
```
Browser cache bị loại khỏi Git. Có thể dùng Chromium/Chrome có sẵn bằng biến BRAVIA_BROWSER_PATH trỏ executable phù hợp. Script chỉ mở trình duyệt headless và mock API.
