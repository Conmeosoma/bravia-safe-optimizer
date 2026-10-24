# Kết nối ADB an toàn

Nguồn: [Android Debug Bridge — Google](https://developer.android.com/tools/adb), [Platform-Tools — Google](https://developer.android.com/tools/releases/platform-tools). Khả năng hỗ trợ tùy model và firmware; làm theo những tùy chọn thực sự có trên TV, không suy ra từ số phiên bản Android.

## Chuẩn bị và USB
Chọn adb.exe từ Platform-Tools chính thức. App tìm SDK qua ANDROID_SDK_ROOT, ANDROID_HOME, vị trí SDK Android thông dụng và PATH; chủ sở hữu phải chọn và bấm kiểm tra trước khi chạy ADB. Mọi lần chạy đều qua runner duy nhất.

Quét bằng nút chẩn đoán; lệnh là `adb devices -l`. Danh sách này chứa cả USB và mạng. USB-C laptop đến USB-A TV không bảo đảm ADB vì USB-A TV có thể là host. Không có thiết bị là kết quả bình thường; không sửa điện hoặc dùng cáp nối hai cổng host. Không tự động cài driver.

- **unauthorized**: mở màn hình TV, kiểm tra và chấp nhận yêu cầu cấp quyền cho đúng máy tính.
- **offline**: kiểm tra TV đang bật và kết nối còn hoạt động, sau đó quét lại.
- **Không có thiết bị**: xem TV có hỗ trợ gỡ lỗi không dây hoặc gỡ lỗi mạng không.
- **Nhiều thiết bị**: chọn một mục; model trong `devices -l` chỉ là thông tin tham khảo, chưa phải danh tính xác nhận.
- **Mất kết nối**: quét lại, chọn lại và xác nhận lại; không tái sử dụng transport handle như danh tính.

## Không dây với mã ghép đôi
Cho TV và laptop vào cùng mạng tin cậy. Trong Cài đặt TV, tìm Giới thiệu/bản dựng và làm theo hướng dẫn Sony để mở Tùy chọn nhà phát triển. Chỉ khi TV có mục Gỡ lỗi không dây/Ghép đôi bằng mã mới dùng nhánh này.

Nhập IPv4, cổng ghép đôi, cổng kết nối và mã sáu chữ số trên TV vào wizard. Hai cổng **không được giả định bằng nhau**; wizard không tự sao chép hay điền cổng 5555.

Do allowlist thực thi của Phase 1 chỉ đọc, app xuất hướng dẫn PowerShell. Bạn tự thực hiện nếu đồng ý:
```powershell
& 'C:\Android SDK\platform-tools\adb.exe' pair <IP>:<CONG_GHEP_DOI>
# Enter the current pairing code at ADB's prompt.
& 'C:\Android SDK\platform-tools\adb.exe' connect <IP>:<CONG_KET_NOI>
```
Các giá trị trong dấu ngoặc là chỗ điền, không chạy nguyên ví dụ. Mã được nhập tương tác trong terminal, không nằm trong command history. Không gửi mã cho backend. Sau đó quét và đối chiếu danh tính trong app. App không dựa vào lời báo ghép đôi để tuyên bố đã kết nối.

Ghép đôi thất bại: kiểm tra mã mới và cổng trong cửa sổ ghép đôi hiện tại. Hết thời gian chờ hoặc sai endpoint: kiểm tra IP hiện tại, cổng kết nối, cùng mạng và quy tắc tường lửa thích hợp. Không tắt tường lửa toàn cục, không port-forward ADB ra Internet.

## Gỡ lỗi mạng đã được TV cung cấp
Nếu Tùy chọn nhà phát triển của TV cung cấp gỡ lỗi mạng và endpoint ADB, dùng nhánh kết nối mạng. Chỉ chạy `connect` tới endpoint đang hiển thị sau khi tự kiểm tra; chấp nhận yêu cầu cấp quyền trên TV. Không chạy adb tcpip, không sửa cấu hình mạng TV và không mặc định 5555.

Phase 1 chỉ hỗ trợ endpoint IPv4 số + cổng 1–65535; chưa hỗ trợ IPv6 hoặc mã mDNS. Nếu ADB liệt kê mã mDNS không hợp lệ với validator, app sẽ chặn thay vì chuyển thẳng vào shell. Kết nối thủ công bằng IPv4 được TV hiển thị rồi quét lại.

## Danh tính và quyền đọc
Chỉ thiết bị ở trạng thái `device` được chọn; trước khi xác nhận phải đọc đủ ro.serialno, ro.product.manufacturer, ro.product.model, ro.product.device và ro.build.fingerprint. Android ID là tùy chọn và có thể không đọc được. Thiếu thuộc tính bắt buộc sẽ chặn xác nhận, không thay bằng mã kết nối hay dữ liệu bịa.

Chấp nhận manufacturer Sony không tự xác minh model thuộc dòng BRAVIA; chủ sở hữu phải đối chiếu. Nếu model sai, không bấm xác nhận. Mọi thông số đều đọc trực tiếp, không đoán phiên bản hay package.
