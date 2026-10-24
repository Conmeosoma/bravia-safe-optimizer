# Chính sách an toàn

AGENTS.md ở gốc là nguồn quy tắc bắt buộc. Phase 1 chỉ READ ONLY, không có REVIEW/APPLY, lệnh đổi package hoặc rollback. pair/connect được hướng dẫn thủ công, không được runner thực thi.

Allowlist gồm version, devices -l; và các lệnh có -s với serial đã kiểm tra: getprop cho tám thuộc tính cố định; settings get secure android_id; cat /proc/uptime; cat /proc/meminfo; df -k /data; cmd package resolve-activity --brief với MAIN/HOME; pm list packages -3/-s/-d. Không cho phép thêm đối số tùy ý.

Không root/remount, flash, fastboot, sideload, reboot recovery/bootloader, reset, xóa dữ liệu, uninstall/clear, thay phân vùng, ảnh hệ thống hoặc adb tcpip. Không tắt Google TV Home, Google Play Services, Sony, OTA, Play Protect hoặc dịch vụ bảo mật. Unknown/manufacturer-specific được bảo vệ; Phase 1 không có thao tác thay đổi bất kỳ package nào.

Serial USB chỉ chữ ASCII/số, dấu chấm, gạch dưới/gạch ngang, không bắt đầu bằng dấu gạch. Endpoint chỉ IPv4 hợp lệ và cổng 1–65535. Package tuân theo các thành phần định danh ASCII; không chấp nhận khoảng trắng, newline, shell metacharacter hoặc leading dash. Không dùng array argv như bảo đảm duy nhất: shell trên TV có thể phân tích lại đối số.

Không tự coi transport handle là danh tính. Phải đọc và đối chiếu thuộc tính ổn định. Nếu sau này có thay đổi, mỗi package phải qua: xác minh danh tính → bảo vệ → trạng thái trước → dry-run → phê duyệt đúng thao tác → journal pending → thực thi → xác minh trạng thái thật → verified/failed. Dừng tiếp theo nếu thất bại; rollback cũng kiểm tra danh tính. Không thay yêu cầu này bằng kiểm tra serial không đổi.

Chỉ chủ sở hữu tự chọn executable từ nguồn Google đáng tin cậy. Kiểm tra đường dẫn và version không phải kiểm tra chữ ký/chuỗi cung ứng. Không cung cấp endpoint nhập lệnh tùy ý. Không chạy thay đổi ADB trên TV thật khi phát triển nếu chưa có phê duyệt chính xác trong chat.

Không bịa giá trị, tốc độ, lợi ích hiệu năng hay khả năng khôi phục. Snapshot cấu hình không phải firmware backup. Test dùng mock; real runner ném lỗi trước spawn trong test. Không ghi pairing code vào log hoặc gửi qua API.
