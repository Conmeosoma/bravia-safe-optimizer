# Khôi phục — chưa triển khai trong Phase 1

Phase 1 không đổi trạng thái package, không tạo journal thay đổi và không có nút hoàn tác. Không tuyên bố đã có backup hoặc khả năng khôi phục firmware.

Các giai đoạn sau phải ghi đầy đủ trạng thái trước và danh tính ổn định, xác minh sau mỗi thao tác, hỗ trợ khôi phục từng thay đổi theo thứ tự có kiểm soát và xử lý journal pending sau gián đoạn. Mỗi lần rollback cần xác minh lại danh tính và phê duyệt đúng thao tác. Chưa triển khai hoặc kiểm chứng các chức năng đó.

Ghép đôi ADB thủ công có thể tạo quan hệ tin cậy. Chủ sở hữu có thể quản lý hoặc thu hồi quyền gỡ lỗi bằng các mục chính thức trên TV khi có; ứng dụng không tự thu hồi hoặc sửa cấu hình TV.
