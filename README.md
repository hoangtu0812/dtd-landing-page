# BSR Digital

## Chạy trang local

Trong PowerShell, tại thư mục dự án:

    node preview.mjs

Trang giới thiệu: http://127.0.0.1:4173
Nếu máy chủ phiên bản trước còn chạy, nhấn Ctrl+C ở cửa sổ của nó rồi chạy lại lệnh. Trang local chỉ lắng nghe trên 127.0.0.1.

## Quản trị riêng

Trang giới thiệu không có nút hoặc liên kết cấu hình. Quản trị viên mở trực tiếp:

    http://127.0.0.1:4173/admin

Thiết lập mật khẩu lần đầu bằng lệnh sau trong PowerShell:

    node setup-admin.mjs

Tự nhập mật khẩu 12–256 ký tự và nhập lại để xác nhận. Ký tự không hiển thị khi nhập. Không có mật khẩu mặc định. Khi chưa thiết lập, quản trị và API ghi đều bị khóa.

- Đăng nhập rồi chỉnh sửa thông tin, nhân sự/nhóm, chức danh, cấp trên, avatar, nhiệm vụ, ứng dụng và roadmap.
- Bấm **Lưu cấu hình** để ghi vào dist/site-config.json. Sau đó tải lại trang giới thiệu.
- Có **Xuất cấu hình / Nhập cấu hình** để sao lưu. Nhập chỉ thay đổi biểu mẫu cho đến khi bấm Lưu.
- Khi xong, bấm **Đăng xuất**.
- Phiên có hạn 8 giờ, mất hiệu lực khi khởi động lại máy chủ hoặc đổi mật khẩu.
- Năm lần sai mật khẩu liên tiếp sẽ tạm chặn đăng nhập 10 phút.
- Đổi/đặt lại mật khẩu trên chính máy này: node setup-admin.mjs --reset
- Mật khẩu chỉ được lưu dưới dạng băm scrypt với salt ngẫu nhiên trong .local/admin-auth.json; thư mục .local được bỏ qua bởi Git và không nằm trong bản xuất bản.
- Nếu sửa code hoặc tệp dữ liệu trực tiếp, người có quyền filesystem vẫn có quyền thay đổi nội dung. Đây là quản trị local, không phải hệ thống tài khoản nhiều người dùng.

## Bản online

Bản online chỉ chứa landing page và nội dung đã xuất bản. Các tệp quản trị nằm trong admin/, bên ngoài dist/, nên không được đưa vào bản triển khai tĩnh. Trang online không có chức năng sửa/lưu bằng localStorage nữa.

Chỉnh sửa trên local, kiểm tra nội dung rồi triển khai lại Sites để cập nhật nội dung chung. Quyền truy cập Sites được giữ như trước.

## Dữ liệu

- dist/site-config.json: nội dung hiển thị, bao gồm tên và avatar đã chọn công bố.
- .site-config.backup.json: bản trước lần lưu gần nhất, không được phục vụ web hoặc đưa vào Git.
- Theo yêu cầu, cấu hình có nội dung mẫu cho giới thiệu, 3 nhóm chuyên môn, 6 nhiệm vụ, 6 ứng dụng và hai roadmap. Các dữ liệu mẫu đều sửa/xoá được trong trang quản trị; cần xác nhận nội dung trước khi dùng chính thức. Thông tin Trưởng phòng Lê Xuân Hiển do người dùng cung cấp.
- Giới hạn: 80 mục mỗi danh sách, 12 cấp tổ chức; avatar đầu vào JPG/PNG/WebP tối đa 5 MB được thu nhỏ trước khi lưu.
- Khi xoá mục có cấp dưới, các mục con chuyển lên cấp trên của mục bị xoá.
- Khi hai cửa sổ sửa cùng lúc, API chặn ghi đè bản mới hơn.

## Mã nguồn và kiểm tra

- dist/: nội dung xuất bản, logo, màu sắc và giao diện người xem.
- admin/: biểu mẫu quản trị, xác thực mật khẩu; chỉ máy chủ local phục vụ sau đăng nhập.
- setup-admin.mjs: thiết lập mật khẩu trực tiếp tại terminal.
- preview.mjs: kiểm tra phiên, Origin, Host, xung đột trước khi ghi.
- node --test tests/config.test.mjs: kiểm tra xác thực, phiên, API và dữ liệu.
- Logo gốc giữ nguyên trong dist/logoBSR.png. Xanh lá #2e9150, xanh chàm #3e478e.
