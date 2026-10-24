# Sony BRAVIA Safe Optimizer

Dashboard Windows chạy cục bộ để kiểm tra Sony BRAVIA của chủ sở hữu. **Phase 1 chỉ đọc**: chưa có phân loại an toàn package, tắt ứng dụng, tối ưu, rollback hoặc điều khiển quảng cáo. Không giả định model hoặc firmware.

## Chạy trên Windows
1. Cài Node.js **24.x** (kèm npm). Mở terminal trong thư mục dự án.
2. Chạy `npm.cmd ci` (lần đầu khi chưa có lockfile: `npm.cmd install`).
3. Chạy `npm.cmd run dev`, mở **http://127.0.0.1:5173**.
4. Để chạy bản build: `npm.cmd run build`, rồi `npm.cmd start`; mở **http://127.0.0.1:4317**. Dừng bằng Ctrl+C.

Trên PowerShell chặn npm.ps1, dùng npm.cmd như trên; không cần đổi execution policy. Backend dùng cổng cố định 4317, Vite dùng 5173 và dừng nếu cổng bận. Chỉ dùng địa chỉ 127.0.0.1; localhost không nằm trong allowlist Host/Origin.

Nếu môi trường giới hạn ghi cache npm ngoài workspace, thêm `--cache .npm-cache` vào lệnh ci/install. Dependency được tải từ npm chỉ khi bạn cài dự án; ứng dụng vận hành không dùng cloud, telemetry, font hay CDN bên ngoài. Các liên kết tài liệu Google chỉ mở khi bạn bấm.

## Cài ADB
Mở [trang Platform-Tools chính thức của Google](https://developer.android.com/tools/releases/platform-tools), chọn bản Windows, chấp nhận điều khoản và giải nén. Không tải ADB từ trang không rõ nguồn gốc. Ứng dụng không tải hoặc cài ADB tự động.

Trong **Kết nối TV**, chọn đường dẫn tìm thấy từ SDK/PATH hoặc dán đường dẫn tuyệt đối tới `adb.exe`, ví dụ `C:\Android SDK\platform-tools\adb.exe`. Dấu cách trong đường dẫn được hỗ trợ. Việc tệp tồn tại hoặc có version ADB không chứng minh nguồn gốc/chữ ký tệp; chỉ chọn bản bạn đã lấy từ Google.

Nhấn **Kiểm tra ADB**, sau đó **Quét thiết bị (USB và mạng)**. Không có thiết bị USB là kết quả dự kiến: cổng USB-A của TV có thể là host. Không sửa cáp hoặc nối hai cổng host. Xem [hướng dẫn kết nối](docs/ADB_CONNECTION.md).

## Luồng sử dụng
- Quét thiết bị, chọn đúng một thiết bị được cấp quyền.
- Đọc nhà sản xuất, model, serial ổn định, device, fingerprint và Android ID khi đọc được. Đối chiếu với TV rồi xác nhận. Thiết bị có manufacturer khác Sony bị chặn; Sony không tự chứng minh quyền sở hữu hay rằng thiết bị là TV.
- Sang **Thông tin thiết bị** hoặc **Ứng dụng** và bấm quét. Dữ liệu chưa đọc không có số giả. Dữ liệu không hỗ trợ hiển thị “không lấy được” kèm lý do.
- Danh tính đọc lại trước/sau mỗi lần quét. Dữ liệu là ảnh chụp tại thời điểm ghi trên màn hình; không có polling hoặc đo hiệu năng ngầm.

Wizard không dây tạo lệnh PowerShell để **bạn tự kiểm tra và thực hiện**. Phase 1 không thực thi `adb pair`/`adb connect`, vì allowlist chỉ chứa thao tác đọc TV. Hai cổng được nhập riêng; mã ghép đôi không gửi backend hoặc ghi log. Đây là giới hạn có chủ ý so với wizard tự động kết nối.

## Kiểm tra dự án
```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
Tests dùng mock runner; real runner bị khóa khi chạy test. Không dùng test để chạm TV. Một số sandbox Windows hạn chế tiến trình build đọc thư mục cha; nếu gặp Access denied, ghi nhận lỗi và chạy kiểm tra trong terminal Windows có quyền đọc thông thường, không thay đổi quyền TV.

## Dữ liệu và tài liệu
Dashboard laptop dùng **phong cách giao diện TV**, nền phong cảnh tối và ba ô **VTVgo, YouTube, Netflix** trên trang chính. Thanh điều hướng mở Kết nối, Thông tin thiết bị và Ứng dụng. Trạng thái chỉ hiện sau khi quét; danh sách đầy đủ nằm trong mục kỹ thuật có thể mở rộng. Thay đổi này không gỡ ứng dụng hoặc thay launcher trên TV. Xem [thiết kế và kiểm tra giao diện hiện tại](docs/TV_UI_DESIGN.md).

Phase 1 giữ lựa chọn TV, danh tính và kết quả quét trong bộ nhớ của phiên. Không ghi snapshot, mã ghép đôi hoặc lịch sử giả xuống đĩa. `data/`, `backups/`, `reports/`, `logs/` dành cho các giai đoạn sau; nội dung bị bỏ qua trong Git. Snapshot cấu hình sau này **không phải bản sao lưu firmware**.

- [Kiến trúc](docs/ARCHITECTURE.md)
- [Chính sách an toàn](docs/SAFETY_POLICY.md)
- [Kế hoạch kiểm thử](docs/TEST_PLAN.md)
- [Phạm vi khôi phục](docs/ROLLBACK.md)
- [Kết quả xác minh Phase 1](docs/PHASE_1_REPORT.md)
