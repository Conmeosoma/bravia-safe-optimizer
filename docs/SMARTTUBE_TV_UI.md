# SmartTube BRAVIA — giao diện theo YouTube trên Smart TV

## Phạm vi bản đầu

Chủ sở hữu chọn giao diện YouTube trên Smart TV. Bản đầu chỉnh giao diện Android TV gốc của SmartTube: nền tối trung tính, menu trái có trạng thái focus/đang chọn, thumbnail 16:9, thẻ bo góc, viền trắng khi chọn, chữ sans-serif và metadata màu xám. Các màn hình duyệt/tìm kiếm/phát video và xử lý remote tiếp tục dùng SmartTube.

Đây là bản tùy chỉnh SmartTube, không phải ứng dụng Google. Chưa có ảnh tham chiếu phiên bản YouTube cụ thể và chưa so sánh trên TV, nên không cam kết giống từng pixel. Bộ lọc chủ đề, cấu trúc menu tài khoản, trang kênh và bảng điều khiển player vẫn theo SmartTube; chưa triển khai lại toàn bộ UX YouTube.

## Mã nguồn và giấy phép

- Nguồn: https://github.com/yuliskov/SmartTube
- Commit gốc: `5c63804758bb4e58c777a77789a3e45c8d022e75`.
- MediaServiceCore: `cb24f1da73adc47eaca8103bfb405d69c33d70f7`.
- SharedModules: `799cfae8a2f5c609b99e87fc673fc62de1c0199a`.
- Giữ giấy phép MIT của SmartTube và các thông báo Apache hiện có trong layout kế thừa. Không lấy logo hay tài sản riêng của YouTube.

## Bản riêng để thử song song

Build flavor `stfdroid` với `-PlocalTvUi=true`, package `app.bravia.smarttube.ui`, nhãn `SmartTube BRAVIA`, hậu tố phiên bản `-bravia-ui1`. Package khác SmartTube chính thức và YouTube. Flavor này không khai báo phụ thuộc Firebase Crashlytics của stable/beta. Chưa kiểm toán toàn bộ hành vi mạng của mã nguồn upstream.

BuildConfig.LOCAL_TV_UI giới hạn thay đổi presenter vào bản riêng. Các overlay XML nằm trong `smarttube/smarttubetv/src/stfdroid/res/`; không áp dụng lên stable/beta. Nhãn và overlay của flavor F-Droid trong bản clone đã được tùy chỉnh, vì thế không dùng clone này để phát hành bản F-Droid gốc.

## Build trên laptop

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Build-SmartTubeUi.ps1
```

Lệnh gọi Gradle Wrapper Java trực tiếp, không gọi ADB và không dùng batch wrapper upstream có bước tự xóa cache. Chỉ dùng ExecutionPolicy Bypass cho tiến trình chạy tệp này, không sửa policy hệ thống. Script dùng JDK 17 và SDK cục bộ trong `data/android-build/`, khôi phục biến môi trường sau khi chạy. Gradle 7.5, AGP 7.4.2, compileSdk 34, build-tools 30.0.3 theo upstream; minSdk flavor 21 không bị hạ. Lần đầu cần tải phụ thuộc Maven/Google/JitPack và SDK tools vào cache cục bộ.

Tác vụ Android: `:smarttubetv:assembleStfdroidDebug`. Đây là bản debug để thử; không phải APK release được nhà phát triển SmartTube ký.

## Kiểm tra và giới hạn

Gradle kết thúc exit code 0, `BUILD SUCCESSFUL in 5m 40s`, 459 tác vụ. Đã kiểm tra cú pháp 8 XML bổ sung/override và script PowerShell; `git diff --check` không lỗi. Chưa chạy unit test hoặc Android lint riêng của SmartTube.

APK ARM 32-bit đã chép ra `reports/SmartTube_BRAVIA_UI_1_armeabi-v7a.apk` (được gitignore), dung lượng 30.484.016 byte. SHA-256: `531678995b8394fa079bc2c0e3012be0e4dd1506775227488069650727673dff`.

`aapt dump badging` xác nhận package `app.bravia.smarttube.ui`, nhãn SmartTube BRAVIA, versionName 32.68-bravia-ui1, minSdk 21, targetSdk 34, native ABI armeabi-v7a. `apksigner verify --verbose` exit code 0, chữ ký v1 và v2 hợp lệ. Đây là khóa debug cục bộ, không phải chữ ký của tác giả SmartTube. Log kiểm tra chữ ký ở `reports/smarttube-ui-signature.txt`.

Build vẫn có cảnh báo của upstream về namespace manifest, định dạng chuỗi nhiều placeholder, API cũ và phiên bản SDK XML. Một số native library không strip được debug symbol và được đóng gói nguyên trạng; build không thất bại vì các cảnh báo này. Công cụ ký có cảnh báo metadata META-INF không được chữ ký JAR bảo vệ; không sửa hoặc bỏ qua xác minh APK.

Dashboard: `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` đều thành công, 59 test mock. ESLint của dashboard loại trừ thư mục mã nguồn Android `smarttube/`; kiểm tra này không thay thế build hoặc kiểm thử Android.

Chưa cài lên TV, chưa chạy emulator, chưa test remote, đăng nhập, phát video, tìm kiếm giọng nói, casting hoặc đo hiệu năng. Không gọi ADB thay đổi thiết bị. Quy tắc Phase 1 chỉ đọc và xác nhận từng thao tác trong AGENTS.md vẫn áp dụng cho mọi bước cài/thay đổi TV tự động.

Sau khi chủ sở hữu cài và tự mở bản thử: kiểm tra Up/Down/Left/Right, OK, Back, focus quay về video vừa xem; thử tìm kiếm tiếng Việt, danh sách video dài và phát một video; ghi lại ảnh màn hình Home, tìm kiếm và player để đối chiếu với YouTube trên cùng TV. Không sửa hoặc tắt Play Protect để cài.
