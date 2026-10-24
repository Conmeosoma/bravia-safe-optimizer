# Chuẩn bị SmartTube cho BRAVIA BF1

Ngày 24/10/2026: chỉ chuẩn bị APK và kiểm tra chỉ đọc. Chưa cài SmartTube, chưa thay đổi YouTube hoặc dock launcher.

## Nguồn và APK

- Nguồn: https://github.com/yuliskov/SmartTube/releases/tag/32.68s
- Tệp tải chính thức: `SmartTube_stable_32.68_armeabi-v7a.apk`, lưu trong `reports/` được gitignore.
- Package: `org.smarttube.stable`, version 32.68, versionCode 2458, minSdk 17.
- Dung lượng 25.135.011 byte.
- SHA-256: `2130b23b17ed5cfd324baec81750a2be22059212b6ee17449f21cae2cb3a60d9`, khớp digest GitHub Releases API.
- `apksigner verify --verbose --print-certs`: exit code 0, chữ ký v1 và v2 hợp lệ. Công cụ có cảnh báo metadata META-INF không được chữ ký JAR bảo vệ; không sửa APK. Certificate SHA-256: `109735aa24fe85e2e1623ebb3b1ecc4bf4263f4c6374e4411d646bfa2eda482a`. Chưa đối chiếu certificate với một kênh tin cậy độc lập.
- Chữ ký/checksum xác nhận tính toàn vẹn, không chứng minh APK không có mã độc. README chính thức công bố một số bản trước bị ảnh hưởng bởi sự cố môi trường phát triển. Giữ Play Protect hoạt động, dừng nếu thiết bị chặn vì bảo mật; không vượt kiểm tra bảo vệ.

SmartTube là ứng dụng bên thứ ba, không phải YouTube của Google. Theo README dự án, ứng dụng không có mã hiển thị quảng cáo, có SponsorBlock tùy chọn. Chưa kiểm thử phát video hoặc chặn quảng cáo trên TV này.

## Kiểm tra TV thật, chỉ đọc

Đã gọi `devices` và đọc sáu thuộc tính danh tính ổn định, API, ABI, danh sách third-party/system/disabled qua RealRunner và allowlist hiện có. Tất cả exit code 0; danh tính khớp TV đã xác minh trước. Model BRAVIA BF1, API 31, ABI armeabi-v7a. Package `org.smarttube.stable` chưa có trong lần quét này. Snapshot và release metadata nằm trong `reports/smarttube-device-check.json` và `reports/smarttube-release.json`, không commit định danh thiết bị.

## Cài thủ công bởi chủ sở hữu

Backend vẫn Phase 1 chỉ đọc, không thêm lệnh cài vào allowlist và không chạy cài từ agent. Nếu chủ sở hữu chọn tự cài trong PowerShell, kiểm tra lại IP và đúng TV trước:

```powershell
$adb = 'C:\Users\NamTien\AppData\Local\Android\Sdk\platform-tools\adb.exe'
& $adb -s 192.168.1.11:5555 install 'C:\Users\NamTien\Documents\Mod Tivi\reports\SmartTube_stable_32.68_armeabi-v7a.apk'
```

Không dùng cờ ghi đè bản đã có. Nếu có Failure, không thử lệnh gỡ hoặc vượt bảo vệ; gửi nguyên lỗi. Khi Success, dùng remote vào danh sách ứng dụng mở SmartTube, thử một video và kiểm tra điều hướng. Không tự đổi Home, gỡ YouTube hoặc thay dock bằng bước này.

## Kiểm tra dự án

`npm.cmd run typecheck`, `npm.cmd test` (59 mock test), `npm.cmd run build`: thành công. Lint lần đầu phát hiện hai lỗi `window` trong JavaScript báo cáo test Android được Gradle sinh ở lần build trước. Đã bổ sung ignore cho `**/build/**` và `data/**` trong ESLint của dự án chính; chạy lại `npm.cmd run lint` thành công. Không thay mã hoặc cấu hình an toàn ADB. Chưa kiểm thử SmartTube trên TV thật và chưa quét mã độc độc lập.
