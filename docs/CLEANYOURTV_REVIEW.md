# Rà soát cleanyourtv — 24/10/2026

Repo cục bộ: `cleanyourtv/`, origin `https://github.com/Conmeosoma/cleanyourtv.git`, nhánh main, commit `cc4c7c596c089c4a16f39480fef75c3349469bf9`. Đây là kết quả đọc bản đã clone, không khẳng định trạng thái mới nhất của GitHub.

## Phạm vi đã đọc và giới hạn

Đã đi qua toàn bộ cây làm việc, đọc nội dung để lập chỉ mục **1.236 tệp**: **1.114 tệp văn bản, 96.625 dòng** và **122 tệp nhị phân/tài nguyên**. Chỉ mục ghi đường dẫn, số dòng, đề mục, khai báo và các thao tác thiết bị nhận diện được tại `reports/cleanyourtv-file-index.json`.

Đã đọc kỹ AGENTS, README tiếng Việt, PROMPT, cấu hình/manifest/build launcher, các nhánh quan trọng của MainActivity và các thành phần UI, scripts cài đặt Windows/Shell, client ADB, disable/restore/recovery, quản lý theme, danh sách Sony BF1, tài liệu theme/module/add-on và CI. Những nhóm lặp lại như danh sách model, bản dịch và tài nguyên được kiểm kê/quét có hệ thống; không tuyên bố đã kiểm toán từng dòng của toàn repo hoặc xem trực quan mọi ảnh nhị phân.

Không chạy bất kỳ script của repo clone, không import module Python của nó, không cài dependency/launcher/add-on, không kết nối ADB và không thay đổi TV trong lần rà soát này. Repo clone còn sạch theo `git status`.

## Dự án làm gì

CleanYourTV gồm hai chức năng lớn: tắt các package theo danh sách model và cung cấp launcher Android chạy trực tiếp trên TV. Nó không phải dashboard React hay server Node trên laptop. Luồng tài liệu là kiểm tra TV → sao lưu → lựa chọn ứng dụng/tính năng → tắt package → build/cài launcher → đặt Home → kiểm tra remote/nguồn vào → khôi phục khi cần.

Nguyên tắc của chính repo là **disable, không uninstall**. Vì vậy clone repo này không tạo ra một đường gỡ ứng dụng khác với điều cấm pm uninstall của dự án cha.

| Nhóm | Nội dung |
|---|---|
| `launcher/` | Launcher `com.gathin.tvhome`, Java/Android XML, AndroidX RecyclerView và DynamicAnimation. 53 tệp Java chính và 30 tệp Java kiểm thử. |
| `tools/` | 29 tệp: client ADB Python, disable/restore, theme, recovery, audit quyền riêng tư, đo hiệu năng, trace, so ảnh, công cụ tài liệu. |
| `examples/` | 260 file debloat cho các model/nền tảng; nhiều thư mục có thêm config hoặc ghi chú. Đây là dữ liệu đóng góp theo máy đã thử, không phải chứng nhận áp dụng cho mọi firmware cùng tên. |
| `themes/` | 8 theme: default, aurora, dussehra, glass, ruska, scenes, six-columns, sweden. |
| `addons/` | 11 ứng dụng Android độc lập, mỗi ứng dụng có project Gradle và quyền riêng. |
| `tests/` | 86 tệp Python kiểm tra dữ liệu, tài liệu, script và các tình huống thiết bị giả. Chưa chạy suite này. |
| `docs/` | Hướng dẫn module, xử lý lỗi, ghi chú thiết bị, cấu hình và quy trình đóng góp. |
| `.github/` | CI, workflow add-on và quy tắc review; không sửa các file này. |

## Launcher và cách tổ chức mã

[`launcher/app/build.gradle`](../cleanyourtv/launcher/app/build.gradle) khai báo minSdk 26, compile/target SDK 34, Java 17, versionName 2.7, versionCode 8. Release bật minify/shrink nhưng dùng debug signing key cho sideload. CI yêu cầu APK dưới 491.520 byte; chưa build APK nên chưa xác nhận kích thước thực tế.

- `MainActivity.java` khoảng 3.222 dòng, điều phối lifecycle, cấu hình, dock/lưới, focus, remote, top menu, HDMI/TV inputs, đồng hồ, thống kê và module cards.
- `AppAdapter.java`, `DockSlots.java`, `DockDecoration.java`, `GridNavigation.java`: lấy các app hiển thị, bố trí dock/lưới, kích thước ô và điều hướng bằng D-pad.
- `Config.java`: đọc cấu hình mặc định từ config.xml, ghi đè bằng theme JSON và các lựa chọn cục bộ. Khóa sai kiểu/không biết được bỏ qua.
- `GlassView.java`: tự vẽ gradient, viền sáng và glow bằng Canvas, cache hardware layer; hiệu ứng kính không cần blur nền theo thời gian thực.
- `WallpaperPlayer`, `WallpaperRotation`, `WallpaperMood`, `HeroArt`, `SkyView`: ảnh nền cục bộ, đổi ảnh theo cấu hình, nội dung hero và trang trí. Không phải streaming video nền của launcher.
- `LibraryApps`, `AppLibraryDialog`, `Order`, `LastOpened`: thư viện, thêm/bớt lối tắt và thứ tự trên Home. Bỏ lối tắt không gỡ APK.
- `HomeKeyService`, `InputKeyService`, `RemoteKeys`, `ServiceRepair`: xử lý remote qua accessibility; ServiceRepair có thể ghi secure settings khi được cấp quyền để khôi phục helper.
- `Cards.java`: đọc module-card metadata, giới hạn đầu vào, ghim quyết định hiển thị theo SHA-256 chứng chỉ ký; đổi chữ ký/nhãn có thể yêu cầu quyết định lại. Card mặc định chưa được chủ sở hữu đồng ý thì không hiển thị.
- `ThemeProvider` giới hạn tệp theme qua `ThemeFiles`, yêu cầu WRITE_SECURE_SETTINGS để ghi từ ADB shell.

Manifest launcher không khai báo INTERNET. Tuy nhiên có ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE, ACCESS_FINE_LOCATION, WRITE_SECURE_SETTINGS và quyền truy cập nguồn TV của Yandex; có các service trợ năng tùy chọn. Không nên diễn giải “không Internet” thành “không cần quyền nhạy cảm”.

## Giao diện và ba ứng dụng bạn muốn

Theme [`themes/glass/config.json`](../cleanyourtv/themes/glass/config.json) đã có `cinematic_home`, `dock_glass`, nút dạng icon, app glow/horizon và tắt overshoot. Ảnh `themes/glass/screenshot.jpg` minh họa đúng kiểu dock trong suốt ở dưới và tên app lớn ở trên.

Các khóa liên quan: `dock_apps`, `fill_dock`, `columns`, `rows_below_dock`, `hidden_apps`, `app_library`, `dock_title`, `dock_opacity`, `wallpaper`, `reduced_motion`.

Ba package đã biết của bạn là `vn.vtv.vtvgotv`, `com.google.android.youtube.tv`, `com.netflix.ninja`. Có thể dùng làm dữ liệu thiết kế dock. Nhưng **chỉ đưa ba tên vào dock_apps không làm các app khác bị gỡ hoặc biến mất khỏi toàn bộ lưới**. Mặc định fill_dock=true có thể bổ sung app vào chỗ trống; hidden_apps/thư viện có ý nghĩa khác với disable/uninstall.

Bạn đã xác nhận mục tiêu hiện tại là dashboard laptop. Vì vậy chỉ nên tham khảo bố cục/hiệu ứng hoặc tài nguyên có điều kiện sử dụng phù hợp; không cần cài launcher lên TV để đổi giao diện dashboard. Ảnh Sweden có ghi công/giấy phép riêng trong CREDITS.md, không coi mọi ảnh là tài nguyên MIT chỉ vì mã nguồn repo dùng MIT.

## Danh sách Sony BRAVIA BF1

[`examples/sony-bravia-bf1/debloat.txt`](../cleanyourtv/examples/sony-bravia-bf1/debloat.txt) mô tả máy BF1/Android 12/API 31, firmware STT2.230811.001 và một biến thể thiết bị BRAVIA_BF1_4K_A. Mã product từng đọc trên TV của bạn là BRAVIA_BF1_4K_M_A; không có fingerprint đầy đủ của máy đóng góp để chứng minh cùng firmware/biến thể.

Danh sách có **11 dòng package đang hoạt động**, không tính các dòng comment:

| Package | Trạng thái trong snapshot của bạn ngày 23/10 |
|---|---|
| tv.samba.ssm | Đang bật |
| com.sony.dtv.promos | Đang bật |
| com.sony.dtv.sonyselect | Đang bật |
| com.google.android.feedback | Đang bật |
| com.sony.dtv.demosupport | Đang bật |
| com.sony.dtv.demosystemsupport | Đang bật |
| com.sony.dtv.multiscreendemo | Đang bật |
| com.google.android.videos | Đang bật |
| com.google.android.youtube.tvmusic | Đang bật |
| com.google.android.play.games | Đang bật |
| com.sonypicturescore | Đã tắt |

Đối chiếu dùng `reports/ung-dung-tv.json` quét lúc 19:33:29 ngày 23/10/2026 giờ Việt Nam, **không phải quét mới**. Cả 11 tên có trong snapshot; điều đó không xác nhận chúng an toàn để tắt. Danh sách không tắt trực tiếp ba package VTVgo/YouTube TV/Netflix nêu trên.

Các ghi chú BF1 còn nói về IP thay đổi sau reboot, applicationdisabler bật lại một số app, long-press remote không lặp, trình chọn Home và setup wizard. Đây là ghi chép của máy đóng góp. Các con số RAM/frame time trong header không phải phép đo của tôi trên TV bạn và không được dùng làm lời hứa hiệu năng.

## Cơ chế công cụ và khác biệt an toàn

Điểm tốt của repo: validate tên package, chặn nhóm Android core, có Home guard, kiểm tra setup wizard sở hữu Wi-Fi, kiểm tra TV_INPUT_HARDWARE, ghi trạng thái trước khi disable và có bản Shell/PowerShell. Ghi recovery bằng file tạm rồi thay thế; giữ bản ghi gốc khi thử lại để không ghi đè trạng thái trước thay đổi.

Các khác biệt quan trọng với AGENTS.md dự án cha:

| Quan sát từ mã | Hệ quả trong workspace này |
|---|---|
| `tools/tv.py` tự mở ADB qua thư viện adb_shell, nhận chuỗi shell bất kỳ và chế độ batch. | Bỏ qua runner.ts và allowlist; không được dùng nó để thao tác TV trong dự án hiện tại. |
| PROMPT có hướng dẫn adb tcpip 5555 và DNS riêng; installer có đổi Home/tắt launcher gốc. | Xung đột với quy tắc không tcpip, không tắt Google TV Home/dịch vụ được bảo vệ và phạm vi Phase 1. |
| disable.ps1 ghi recovery rồi chạy batch nhiều package; tv.py tiếp tục từng dòng và nhánh shell/batch không thu exit code từng lệnh. | Chưa đáp ứng quy trình pending → execute → verify → verified/failed và dừng ngay khi xác minh thất bại cho từng package. |
| recovery.py đặt tên record từ host và hash đường dẫn list; record có host/home/settings/packages. | Chưa thấy cơ chế đối chiếu bộ thuộc tính danh tính ổn định theo yêu cầu của bạn trước thay đổi/rollback. IP đổi có thể khiến không tìm đúng record. |
| Không có recovery record thì restore tạo phương án bật toàn bộ list và đặt Home/animation về mặc định, kèm cảnh báo. | Không bảo đảm khôi phục chính xác trạng thái ban đầu; không phù hợp nguyên tắc chặn khi chưa chắc đảo ngược. |
| Một số guard không đọc được thì cảnh báo rồi tiếp tục; các biến FORCE_HOME/FORCE_SETUPWRAITH/TVINPUT_ALLOW có thể bỏ qua guard tương ứng. | Không đạt nguyên tắc chặn khi thiếu chứng cứ của dự án cha. Nhóm Android core vẫn có chặn riêng không override. |
| build-and-install.ps1 ngoài build còn upload, install, grant location, compile package, đổi Home và có thể disable stock; tùy chọn có thể bật accessibility/grant secure settings. | Không phải lệnh build chỉ đọc; không chạy chỉ vì muốn xem giao diện. |
| theme.ps1 ghi/xóa file trên TV, force-stop launcher và có nhánh sửa danh sách accessibility. | Không phải thao tác xem theme thuần túy; có rm và ghi secure settings, nằm ngoài allowlist hiện tại. |

Đây là đánh giá tương thích với yêu cầu của bạn từ mã nguồn, không phải kết luận toàn repo độc hại hay chứng nhận rằng các guard bảo vệ được mọi TV.

## Add-on

11 add-on gồm Brightness, Capacity Stats, Frigate Glance, Headphones, Photo Prints, Photo Screensaver, Prayer Times, Sleep Timer, TV Hub, TV Static và Weather. Chúng không được build chung vào launcher.

Capacity Stats/Photo Prints không khai báo quyền dùng Internet; Weather, Prayer Times, TV Hub, Frigate Glance và Photo Screensaver có khai báo INTERNET. Một số add-on có overlay, dịch vụ foreground, boot receiver, Bluetooth hoặc accessibility. TV Hub có usesCleartextTraffic=true. Vì vậy không thể lấy đặc tính offline của launcher để suy ra mọi add-on đều offline hoặc không cần kiểm tra quyền.

## Kiểm chứng đã thực hiện

- Phân tích tĩnh bằng thư viện chuẩn, không thực thi mã repo: **106 Python AST, 186 XML, 58 JSON và 260 danh sách package** phân tích được, không báo lỗi cú pháp/định dạng. Điều này không xác minh hành vi runtime hoặc độ an toàn.
- Kiểm kê 8 cấu hình theme, 11 manifest add-on, cấu trúc kiểm thử và CI.
- CI của repo mô tả Python unittest; launcher dùng JDK 17/SDK 34/build-tools 34.0.0 với testReleaseUnitTest, lintRelease, assembleRelease và size gate. **Chưa chạy** các bước đó cho repo clone.
- Theo AGENTS dự án cha, đã chạy `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` tại gốc **Sony BRAVIA Safe Optimizer**: đều đạt, 59 test mock. Đây không phải 59 test của cleanyourtv và không xác nhận launcher Java build thành công.
- Không chạy tv.py, disable, restore, theme, build-and-install, privacy, bench hoặc trace; không thử TV thật trong tác vụ này. Chưa kiểm thử tất cả hình ảnh/theme trên thiết bị.

Kết luận: repo có nhiều phần có thể tham khảo cho giao diện TV và danh sách BF1, nhưng không thể dùng nguyên luồng dọn dẹp/cài đặt trong workspace có các bất biến hiện tại. Với dashboard laptop, phần phù hợp trước mắt là cấu trúc dock/cinematic và ý tưởng theme; mọi tối ưu thiết bị vẫn là công việc riêng cần thiết kế, chứng cứ và xác minh từng thao tác.
