# Sửa lỗi luồng quét — 23/10/2026

## Quan sát thực tế
Khi bắt đầu chẩn đoán, không kết nối HTTP được tới cả 127.0.0.1:4317 và 127.0.0.1:5173. Chạy lại `npm.cmd run dev` khởi động được hai dịch vụ. RealRunner đọc `devices -l` và API `/api/devices` qua cả backend lẫn proxy Vite đều trả về một thiết bị ở `192.168.1.11:5555`, trạng thái `device`, model quảng bá BRAVIA_BF1.

Chưa có bằng chứng tái hiện trực tiếp lần bấm trên trình duyệt của chủ sở hữu. Không kết luận TV không kết nối chỉ từ trạng thái trống của dashboard.

## Đã sửa
- Quét lấy token backend mới trước mỗi lần chạy; không tiếp tục dùng token cũ sau khi backend khởi động lại.
- Nếu phiên backend chưa có ADB đã chọn, nút Quét kiểm tra version rồi quét; không khóa nút vì thiếu phiên cấu hình cũ.
- Kiểm tra ADB cũng lấy token mới, cho phép thử lại sau gián đoạn.
- Hiển thị số thiết bị, thời điểm quét và hướng dẫn Đọc danh tính ngay dưới nút; lỗi không bị xóa chỉ vì đổi trang.
- Lỗi proxy/đầu ra JSON không hợp lệ có thông báo tiếng Việt; lỗi mạng không biến thành danh sách rỗng.
- Cấu hình ADB thất bại không giữ đường dẫn đã cấu hình của phiên cũ.
- Không tự chọn hoặc xác nhận TV, không thêm lệnh ADB và không thay đổi thiết bị.

## Xác minh
`npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` đều đạt. 59 test mock đạt, trong đó 5 test mới kiểm tra luồng frontend gọi API, phục hồi token, backend gián đoạn và thất bại cấu hình. Test tự động không dùng TV thật.

Chẩn đoán thủ công chỉ đọc qua API thật đã phát hiện thiết bị ADB mạng nêu trên. Không quét thông số/package, không phê duyệt danh tính thay chủ sở hữu và không chạy thao tác thay đổi TV. Chưa kiểm tra tương tác hiển thị bằng trình duyệt trong lần sửa này.

Chủ sở hữu tải lại trang 127.0.0.1:5173, vào Kết nối TV và bấm Quét; kết quả phải hiện ngay dưới nút. Sau đó vẫn cần Đọc danh tính và xác nhận đúng TV.
