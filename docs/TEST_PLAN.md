# Kế hoạch kiểm thử

## Kiểm thử tự động — không có TV thật
Chạy typecheck, lint, test và build tại gốc dự án. Tests trong tests/ dùng MockRunner, không spawn ADB. RealRunner phải ném lỗi dưới NODE_ENV=test hoặc các dấu hiệu Vitest. HTTP tests bind cổng loopback ngẫu nhiên, truyền runner giả; không dùng real runner hoặc thiết bị.

Bao phủ: không có USB; unauthorized; offline; nhiều thiết bị và chọn đúng một; không phải Sony; đổi model/danh tính; xác nhận sai ticket; mất mạng; timeout; pairing failure và sai endpoint qua phân loại lỗi; lệnh không hỗ trợ; exit code 0 nhưng stdout báo lỗi; thông số sai hoặc thiếu; package mâu thuẫn; injection trong serial/endpoint/package/path; chặn thực thi pair/connect và mọi thao tác package; kiểm tra chỉ runner nhập child_process; Host/Origin/token; endpoint thay đổi không tồn tại.

Pairing failure hiện chỉ kiểm chứng bộ phân loại lỗi/hướng dẫn; không phải kiểm thử tích hợp pair vì Phase 1 không thực thi pair. Không tuyên bố thử ghép đôi thực tế.

## Kiểm tra thủ công chỉ đọc — cần thiết bị của chủ sở hữu
1. Chạy ứng dụng; kiểm tra READ ONLY luôn hiện ở màn hình rộng và hẹp. Kiểm tra bàn phím, focus, trạng thái trống/lỗi/đang đọc và bốn trang.
2. Khi chưa chọn ADB, các nút đọc bị khóa. Thử đường dẫn không tồn tại; phải có lỗi tiếng Việt. Chọn adb.exe chính thức có dấu cách trong đường dẫn và kiểm tra version.
3. Quét thiết bị trước. Nếu không có TV qua USB, ghi nhận kết quả dự kiến; không suy ra model hoặc thay dây bằng cáp host-host.
4. Khi có nhiều thiết bị, chọn đúng một; mục unauthorized/offline không cho đọc danh tính. Xác nhận trên TV nếu cần.
5. Nếu dùng không dây, chủ sở hữu tự đọc IP/cổng trên TV, tự ghép đôi/kết nối bằng hướng dẫn sau khi kiểm tra lệnh. Không dùng adb tcpip. Quét lại để xác minh.
6. Đối chiếu ro.serialno, manufacturer, model, device, fingerprint và Android ID khi có. Nếu model sai thì không xác nhận. Mã kết nối không thay thế serial ổn định.
7. Xác nhận đúng TV rồi đọc thông tin, so đầu ra thực với UI: Android, API, ABI, uptime, MemTotal/MemAvailable, df /data, launcher. Định dạng không hỗ trợ phải có lý do “không lấy được”.
8. Quét ứng dụng; so ba danh sách -3/-s/-d. Tìm package và lọc loại. Không có nhãn/mục đích đoán hoặc nút tắt.
9. Ngắt mạng TV rồi bấm đọc; phải báo lỗi và yêu cầu chọn/xác nhận lại. Chưa quét lại thì dữ liệu cũ chỉ là ảnh chụp có thời gian, không chứng minh kết nối còn sống.
10. Xem tab Network: không có request cloud hoặc telemetry. Không có lệnh ngoài allowlist trong nguồn. Dừng bằng Ctrl+C.

Không chạy script thay đổi package để kiểm thử. Ghi riêng thiết bị thực sự phát hiện, lệnh thực sự chạy và kết quả; nếu không có thiết bị thì ghi chưa xác minh, không đánh dấu pass.
