# Chuẩn bị ảnh nền miền Bắc cho TV Home

Ảnh chủ sở hữu cung cấp: `C:\Users\NamTien\Downloads\anh-dep-mien-bac-10.jpg`. Bản sao nguyên vẹn tại `reports/bravia-mien-bac.jpg`, 189.850 byte, 1200×675, đúng tỉ lệ 16:9. Không sửa ảnh hoặc upscale.

SHA-256: `705b1085a2695bf8598fe8cd633d19edafc27097b2c10602b479a704f116259a`.

## Kết quả chỉ đọc ngày 24/10/2026

Đã quét ADB và đối chiếu đủ sáu thuộc tính danh tính qua RealRunner: đúng BRAVIA BF1 đã xác minh trước. Package `com.gathin.tvhome` có trong danh sách package mới quét. Default Home hiện là `com.google.android.apps.tv.launcherx/.home.HomeActivity`; thêm hình cho TV Home không đổi ảnh nền của Google TV Home. Snapshot chỉ đọc lưu trong `reports/wallpaper-device-check.json` được gitignore.

## Thao tác đang chờ phê duyệt

Phạm vi đang là Phase 1 chỉ đọc. Chưa ghi file, chưa thay theme, chưa đổi Home trên TV. Không chạy script `theme.ps1` upstream vì script đó có bước xóa file và sửa accessibility ngoài yêu cầu này.

Đề xuất ngoại lệ giới hạn: thêm đúng một ảnh vào bộ chọn hình nền của launcher qua ThemeProvider đã có. Mẫu lệnh cần duyệt:

```text
adb -s 192.168.1.11:5555 shell content write --uri content://com.gathin.tvhome.theme/wallpapers/mien-bac-705b1085.jpg
```

stdin là nguyên byte từ `reports/bravia-mien-bac.jpg` với SHA-256 nêu trên; không dùng shell redirection hoặc shell script. Trước khi ghi phải xác minh lại danh tính, kiểm tra package vẫn có trong scan mới, kiểm tra đích chưa tồn tại (nếu có thì dừng), xác nhận thao tác, journal pending. Sau khi ghi phải đọc lại byte từ provider và đối chiếu hash rồi mới đánh dấu verified; exit code 0 riêng lẻ chưa đủ.

Runner hiện chỉ hỗ trợ lệnh chỉ đọc và chưa có template này. Chỉ bổ sung xử lý/template giới hạn sau khi chủ sở hữu cho phép ngoại lệ; mọi ADB vẫn phải qua runner.ts. Không có quyền phê duyệt mặc định cho sửa config, restart launcher, accessibility hoặc đổi Home. Khi ảnh đã xác minh, chủ sở hữu mở TV Home → cài đặt launcher → Hình nền để chọn ảnh. Có thể quay về nền trước qua bộ chọn này; nếu cần xóa file đã thêm phải duyệt riêng thao tác xóa đúng URI, không dùng rm.

## Kiểm tra

Đã chạy `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`: thành công; 59 mock test, không có test thay đổi TV. Đã xác minh kết nối, danh tính, package và default Home trên TV thật bằng lệnh chỉ đọc. Chưa xác minh ảnh có trên TV hoặc hình ảnh hiển thị thực tế.
