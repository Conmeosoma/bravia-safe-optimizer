# Báo cáo Phase 1 — 23/10/2026

## Đã xây dựng
Workspace shared/backend/frontend; TypeScript, React/Vite; dashboard tiếng Việt gồm Tổng quan, Kết nối TV, Thông tin thiết bị, Ứng dụng; chỉ báo READ ONLY; khám phá ADB và nhập đường dẫn có dấu cách; chẩn đoán USB/mạng; chọn một thiết bị và xác nhận danh tính; thông số chỉ đọc; bảng package tìm kiếm/lọc; tài liệu Windows và an toàn.

Runner duy nhất dùng spawn, shell:false, allowlist chỉ đọc, timeout và giới hạn đầu ra. HTTP loopback, Host/Origin chính xác, token theo phiên, không CORS wildcard. Không có endpoint thay đổi TV. Không có phím tắt chạy shell tùy ý.

## Đã xác minh bằng mock
54 test Vitest đạt: validator và injection; USB không có thiết bị; unauthorized/offline; nhiều thiết bị; sai nhà sản xuất/model/danh tính; bắt buộc xác nhận; mất kết nối; timeout; unsupported; bộ phân loại pairing failure/sai endpoint; parser thông số và package; không có endpoint pair/connect/disable/rollback; token/Host/Origin; tuần tự hóa; real runner bị chặn dưới test; chỉ runner nhập child_process.

Không có test nào dùng ADB thật. Những số liệu trong fixture là dữ liệu giả có tên MOCK, chỉ để kiểm thử; không đưa vào dashboard thực tế.

## Kiểm tra thực tế trên laptop
- Node.js v24.14.0; npm.cmd 11.9.0.
- Phát hiện adb.exe trong Android SDK Platform-Tools của tài khoản Windows hiện tại.
- Qua real runner: `adb version` exit code 0; Android Debug Bridge 1.0.41, Platform-Tools 37.0.1-15733141.
- Qua real runner sau sửa socket: `adb devices -l` exit code 0, đầu ra **List of devices attached** với danh sách trống. ADB daemon cục bộ được khởi động; không có lệnh thay đổi TV.
- Smoke HTTP với bản build: HTML tiếng Việt, JS/CSS và bootstrap READ ONLY được phục vụ qua 127.0.0.1; không gọi ADB trong smoke.

## Đã xác minh trên TV thật
**Chưa có.** Không có thiết bị ADB nào được phát hiện trong lần chẩn đoán. Không đọc danh tính, model, firmware, Android, RAM, lưu trữ hoặc package trên TV thật. Không có cơ sở xác nhận TV đã kết nối.

USB-A TV có thể là cổng host; danh sách trống là kết quả dự kiến, không chứng minh cáp lỗi hoặc TV không hỗ trợ ADB không dây.

## Lệnh kiểm tra và kết quả
- `npm.cmd install --cache .npm-cache`: đạt sau khi chuyển cache vào workspace. Lockfile đã tạo. npm audit sau cập nhật dependency: 0 lỗ hổng được báo tại thời điểm kiểm tra.
- `npm.cmd run typecheck`: đạt.
- `npm.cmd run lint`: đạt sau sửa cấu hình globals cho script smoke.
- `npm.cmd test`: 54/54 đạt, hai tệp test.
- `npm.cmd run build`: đạt cho cả ba workspace.
- `node scripts/smoke.mjs`: đạt; không gọi ADB.
- Các kiểm tra thật `version`, `devices -l` được gọi bằng Node nhập discovery và RealRunner từ bản build, không thực thi trực tiếp ở nơi khác.

Các lỗi đã gặp và sửa: PowerShell chặn npm.ps1 (dùng npm.cmd); cache ngoài workspace không ghi được (dùng .npm-cache); esbuild config loader không đọc được thư mục cha trong sandbox (dùng configLoader runner); dependency Vitest cũ bị npm audit cảnh báo (cập nhật Vitest); sai narrowing TypeScript và lint regex kiểm tra control character; HTTP mock dùng fetch không chuyển Host như mong muốn (dùng node:http request trong test); socket ADB có host bị coi là remote (đổi tcp:5037, loại biến địa chỉ server kế thừa). Lỗi smoke command do quoting PowerShell được thay bằng script smoke có thể chạy lại. Không che các lần kiểm tra thất bại bằng dữ liệu giả.

## Giới hạn và chưa xác minh
- Wizard **hướng dẫn pair/connect thủ công** thay vì thực thi, để giữ allowlist chỉ đọc. Hai cổng nhập riêng, mã ghép đôi chỉ ở bộ nhớ UI và được nhập tương tác trong terminal; không lưu hoặc gửi backend.
- Chưa kiểm chứng ghép đôi Wi-Fi, xác nhận RSA hoặc tính tương thích lệnh trên firmware Sony thật.
- Chưa kiểm tra tương tác/hiển thị bằng trình duyệt tự động hay thủ công; đã kiểm tra build và phục vụ tài nguyên HTTP. Các bước kiểm tra UI bằng bàn phím và kích thước màn hình nằm trong TEST_PLAN.md.
- Chỉ hỗ trợ endpoint IPv4 số; không IPv6/mDNS. Danh tính bắt buộc thiếu thì chặn thay vì suy đoán.
- Version ADB không chứng minh nguồn gốc/chữ ký executable. Chủ sở hữu phải chọn bản từ Google.
- Badge là kết quả lần thao tác gần nhất; không polling kết nối liên tục. Dữ liệu có thời điểm quét và là ảnh chụp.
- Chưa có phân loại package, tối ưu, thay đổi trạng thái, snapshot hay rollback. Không tuyên bố có backup firmware.

Đã dừng ở Phase 1. Chưa bắt đầu Phase 2.
