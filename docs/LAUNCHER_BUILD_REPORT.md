# Báo cáo build launcher BRAVIA — 24/10/2026

Đã build APK cục bộ từ `cleanyourtv`, commit `cc4c7c596c089c4a16f39480fef75c3349469bf9`. Chưa cài APK, mở launcher hoặc thay đổi Home trên TV.

## Bản build

- Tệp: `reports/bravia-vtvgo-youtube-netflix.apk` (được gitignore).
- Package: `com.gathin.tvhome`, phiên bản 2.7, versionCode 8.
- Android tối thiểu: API 26; target/compile API 34, không hạ minSdk.
- Dung lượng: 488.355 byte, thấp hơn ngưỡng 491.520 byte của dự án.
- SHA-256: `a901abbbb0230e097ec86b880975b674d830b8deb6472b455e397d7ae342d609`.
- `apksigner verify --verbose`: thành công, chữ ký v2. Bản release dùng khóa debug theo cấu hình gốc; không phải bản phát hành cửa hàng.
- Chỉ sửa `launcher/app/src/main/res/values/config.xml`: dock VTVgo (`vn.vtv.vtvgotv`), YouTube (`com.google.android.youtube.tv`), Netflix (`com.netflix.ninja`); 3 cột; không tự thêm app lấp dock; kính, cinematic và ánh sáng theo ứng dụng; tắt độ nảy focus.
- Không gỡ hoặc tắt các ứng dụng khác. Cấu hình dock không đồng nghĩa chỉ ba ứng dụng còn được cài trên TV.

## Công cụ và lệnh

JDK Temurin 17.0.20.1+1, Gradle wrapper 8.9 có SHA-256 ghim sẵn, SDK platform 34 revision 3 và build-tools 34.0.0. Công cụ/cache nằm trong `data/android-build/`, không thay JAVA_HOME hệ thống. ZIP JDK kiểm tra SHA-256 theo metadata Adoptium; ZIP SDK kiểm tra SHA-1 theo danh mục Google. Tái sử dụng tệp license SDK đã có trên máy. Trong build đầu, Gradle tự bổ sung Platform-Tools 37.0.1 vào SDK cục bộ này; không dùng bản đó để gọi ADB.

Đã chạy:

```powershell
# Trong cleanyourtv/launcher, biến môi trường trỏ đến data/android-build
.\gradlew.bat --no-daemon testReleaseUnitTest lintRelease assembleRelease

# Tại thư mục dự án chính
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Đã dùng `aapt dump badging`, `apksigner verify --verbose`, kiểm tra kích thước và SHA-256 của APK. Không chạy `build-and-install.ps1`, `tools/tv.py` hoặc script debloat.

## Đã xác minh bằng kiểm tra cục bộ và mock

- Gradle kết thúc exit code 0, BUILD SUCCESSFUL; 200 unit test JVM, 0 lỗi, 0 thất bại, 0 bỏ qua.
- Android lint hoàn tất: 0 error, 73 warning, 83 information; các cảnh báo chưa được sửa. Chi tiết tại `cleanyourtv/launcher/app/build/reports/lint-results-release.html`.
- Dashboard: typecheck, lint, build đều exit code 0; 59 test mock thành công. Test không truy cập TV.
- APK có đúng package, phiên bản, minSdk và targetSdk nêu trên; chữ ký hợp lệ. Không có quyền INTERNET trong kết quả `aapt`.

## TV thật và phần chưa xác minh

Đã gọi `devices` qua RealRunner và ADB chính thức đã có trên máy, kể cả ngoài sandbox: exit code 0 nhưng danh sách thiết bị trống. Không phát hiện TV trong phiên này. Đây chỉ là kiểm tra kết nối; không phải kiểm thử launcher trên TV thật.

Chưa xác minh danh tính TV hiện tại, tương thích cài đặt/chữ ký với package đã có, remote, HDMI, hiệu năng, giao diện thực tế và đường quay về Home gốc. Dữ liệu TV ở phiên trước không thay thế bước kiểm tra danh tính mới.

`AGENTS.md` gốc quy định phạm vi Phase 1 chỉ đọc và mọi ADB phải qua runner với allowlist. Hiện chưa có lệnh cài đặt trong allowlist. Muốn cài cần chủ sở hữu cho phép mở rộng phạm vi, sau đó chuẩn bị kiểm tra danh tính, trạng thái trước, phương án hoàn tác, journal và xác nhận chính xác từng lệnh. Không tự dùng script upstream để vượt quy tắc này; không tắt launcher Google/Sony hoặc dịch vụ được bảo vệ.
