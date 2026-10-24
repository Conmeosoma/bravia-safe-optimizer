# Sony BRAVIA Safe Optimizer — Quy tắc dự án

## Sứ mệnh và ngôn ngữ
Ứng dụng Windows cục bộ, Node.js 24, TypeScript, React + Vite; kiểm tra TV Sony BRAVIA của chủ sở hữu qua ADB. Chỉ thay đổi có thể đảo ngược sau khi chủ sở hữu phê duyệt từng thao tác. Không cloud, telemetry hoặc truy cập từ xa.
Giao tiếp, UI và tài liệu bằng tiếng Việt. Chuỗi UI nằm trong `packages/frontend/src/i18n/vi.json`. Định danh và chú thích mã nguồn bằng tiếng Anh.

## Bất biến — không được nới lỏng
1. Mặc định READ ONLY. Các chế độ là READ ONLY, REVIEW, APPLY. APPLY cần danh tính đã kiểm chứng và xác nhận chính xác thao tác.
2. Mọi lời gọi ADB qua `packages/backend/src/adb/runner.ts`. Chỉ tệp đó nhập `child_process`; dùng `spawn`, `shell:false`, mảng đối số và allowlist mẫu lệnh chính xác.
3. Kiểm tra package, serial và endpoint bằng regex nghiêm ngặt trước khi dùng. `adb shell` nối lại đối số và shell trên TV phân tích lần nữa; mảng đối số không đủ chống injection. Package phải có trong lần quét mới nhất của thiết bị đã chọn.
4. Không chạy hoặc thêm vào allowlist: adb root, adb remount, adb reboot bootloader/recovery, adb sideload, fastboot, pm uninstall, pm clear, rm, dd, mkfs, hoặc thao tác reset, flash, root, phân vùng hay ảnh hệ thống. Không bao giờ chạy adb tcpip. Không tắt Google TV Home, Google Play Services, dịch vụ Sony, OTA/update, Play Protect hoặc dịch vụ bảo mật.
5. Danh tính gồm ro.serialno, ro.product.manufacturer, ro.product.model, ro.product.device, ro.build.fingerprint và android_id khi đọc được. ADB serial hoặc ip:port chỉ là mã kết nối. Đọc lại danh tính trước mọi thay đổi và rollback.
6. Mỗi lần một package theo thứ tự: kiểm tra danh tính, quy tắc bảo vệ, ghi trạng thái trước, xem trước dry-run, xác nhận rõ ràng, ghi journal pending, thực thi, xác minh đầu ra thiết bị, cập nhật verified hoặc failed. Dừng mọi thay đổi tiếp theo nếu xác minh thất bại.
7. Package chưa biết hoặc đặc thù nhà sản xuất được bảo vệ. Chặn nếu chưa chắc an toàn hoặc khả năng đảo ngược.
8. Không khẳng định thành công khi chưa kiểm tra exit code và trạng thái thiết bị. Không bịa số liệu hoặc tuyên bố đã test TV thật khi chưa phát hiện và thực sự test.
9. Test chỉ dùng mock runner, không chạm TV thật. Real runner phải ném lỗi trong môi trường test.
10. Backend chỉ bind 127.0.0.1. Endpoint thay đổi cần token ngẫu nhiên theo phiên; kiểm tra Host và Origin; không wildcard CORS.
11. Khi phát triển, không thực thi lệnh ADB thay đổi TV thật nếu chủ sở hữu chưa phê duyệt chính xác lệnh đó trong chat.

## Quy trình
Làm từng giai đoạn. Cuối mỗi giai đoạn dừng và báo cáo phần đã xây dựng, lệnh đã chạy, kết quả test và phần chưa xác minh.
Trước báo cáo chạy `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`; báo lỗi trung thực. Trên PowerShell bị chặn npm.ps1 có thể dùng npm.cmd tương đương.
Tài liệu ở docs/, không tạo thư mục dư thừa.
Phạm vi hiện tại: Phase 1, chỉ đọc. `adb pair` và `adb connect` chỉ xuất hướng dẫn thao tác thủ công, không thuộc allowlist thực thi.
