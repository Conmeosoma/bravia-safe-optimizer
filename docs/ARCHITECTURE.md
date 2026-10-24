# Kiến trúc Phase 1

Workspace npm gồm shared (kiểu, validator, allowlist), backend (runner, discovery, parser, service, HTTP) và frontend React/Vite. Không tạo thêm thư mục dự án lồng nhau.

Luồng: trình duyệt → HTTP nội bộ → service → runner → ADB. `runner.ts` là nơi duy nhất nhập child_process. Chỉ runner sinh argv từ lệnh định kiểu và allowlist cố định; không có API nhận chuỗi shell hay package tùy ý.

Backend bind 127.0.0.1:4317. Vite bind 127.0.0.1:5173 và proxy /api tới backend. Bản build được backend phục vụ cùng origin. Host chỉ cho phép hai địa chỉ này; Origin nếu có phải khớp chính xác. Cross-site bị chặn, không bật CORS. POST yêu cầu JSON và token ngẫu nhiên 256 bit của phiên backend. Token không lưu đĩa hoặc URL.

API: GET /api/bootstrap (token, đường dẫn gợi ý); POST /api/adb/configure, /api/devices, /api/select, /api/confirm, /api/inspect, /api/packages. POST chỉ cấu hình phiên cục bộ hoặc kích hoạt đọc; không có endpoint thay đổi TV. Mọi thao tác service tuần tự; yêu cầu đồng thời bị từ chối.

Chọn thiết bị tạo ticket xác nhận cho đúng danh tính. Quét trước/sau đọc lại danh tính để tránh trộn kết quả giữa thiết bị. Mất quyền hoặc kết nối sẽ hủy lựa chọn. Quét package dùng hợp của -3 và -s; -d xác định đã tắt. Danh sách mâu thuẫn làm lần quét thất bại. Chưa có giao diện thực thi theo tên package.

Reading<T> phân biệt giá trị đọc được và lý do không đọc được. MemAvailable không thay bằng MemFree, KiB không nhầm MB. df chỉ nhận định dạng khối 1K và mount /data; định dạng khác báo không lấy được. Launcher resolver không được coi là launcher mặc định.

Mỗi process có timeout 12 giây, tối đa 4 MiB đầu ra và kiểm tra exit code. ADB server đích bị giới hạn về loopback qua biến môi trường; không cấu hình server lắng nghe bên ngoài. ADB có thể khởi động daemon cục bộ khi chạy devices; “chỉ đọc” ở đây nói đến trạng thái TV.

Không tải nhãn/purpose package, không dùng analytics/CDN/fonts từ mạng. Dữ liệu phiên ở bộ nhớ; chưa có journal hay snapshot vì chưa có thay đổi. Các chức năng giai đoạn sau không được bật giả bằng nút không hoạt động.
