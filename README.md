# BSR Digital — Landing page và cấu hình nội dung

## Chạy local

Trong PowerShell:

```powershell
cd "C:\Users\Hoang Tu\Desktop\BSR\1. Source Code\dtd\bsr-digital"
node preview.mjs
```

- Trang giới thiệu: http://127.0.0.1:4173
- Trang cấu hình: http://127.0.0.1:4173/admin.html
- Giữ cửa sổ PowerShell mở. Nhấn Ctrl+C để dừng.
- Nếu máy chủ cũ đang chạy, dừng và chạy lại để có API lưu cấu hình.
- Cần chạy qua HTTP; không mở trực tiếp index.html bằng file:// vì trang dùng JavaScript modules và đọc JSON.

## Cấu hình tổ chức

1. Mở “Cấu hình nội dung”, đến “Sơ đồ tổ chức”.
2. Thêm nhân sự hoặc nhóm; nhập tên, chức danh, mô tả và chọn cấp trên.
3. Chọn “Trực thuộc phòng” để đặt một mục ở cấp cao nhất.
4. Thêm avatar JPG/PNG/WebP tối đa 5 MB. Ảnh được thu nhỏ và lưu cùng cấu hình.
5. Dùng nút ↑/↓ để sắp xếp. Khi xoá mục có cấp dưới, các mục con được chuyển lên cấp trên của mục bị xoá.
6. Bấm “Lưu cấu hình”, sau đó mở lại trang giới thiệu.

Thông tin đã biết ban đầu chỉ gồm tên phòng, đơn vị chủ quản, tổng công ty và anh Lê Xuân Hiển — Trưởng phòng. Không có nhóm, chức năng, ứng dụng hay mốc roadmap giả định. Các danh sách chưa cấu hình hiển thị trạng thái chưa cập nhật.

Có biểu mẫu riêng để cập nhật giới thiệu, nhiệm vụ, ứng dụng và hai roadmap.

## Nơi lưu dữ liệu

**Local với preview.mjs:** nút Lưu ghi vào `dist/site-config.json`, giữ lại qua lần khởi động sau và dùng chung giữa các trình duyệt truy cập máy chủ local này. Bản trước lần lưu gần nhất nằm ở `.site-config.backup.json` ngoài thư mục phục vụ web. Tệp cấu hình có thể chứa tên và avatar; bảo quản bản sao lưu theo nhu cầu.

**Bản Sites online hoặc máy chủ tĩnh khác:** nút Lưu chỉ ghi vào localStorage của trình duyệt. Đây không phải trang quản trị máy chủ dùng chung. Nội dung đã lưu tại trình duyệt đó sẽ được ưu tiên so với cấu hình xuất bản. Trang ghi rõ chế độ lưu hiện tại.

Dùng **Xuất cấu hình** để tải JSON và **Nhập cấu hình** để nạp vào biểu mẫu, kiểm tra rồi Lưu. Để đưa cấu hình lên bản online cho mọi người, thay `dist/site-config.json` bằng tệp đã xuất và triển khai lại Sites. Trang cấu hình không tự xuất bản.

## Mã nguồn

- `dist/logoBSR.png`: ảnh gốc người dùng cung cấp, không đổi tỷ lệ/màu sắc.
- `dist/brand.css`: màu xanh lá #2e9150, xanh chàm #3e478e theo logo.
- `dist/index.html`, `dist/app.js`: giao diện đọc cấu hình, dựng sơ đồ, ứng dụng và roadmap.
- `dist/admin.html`, `dist/admin.css`, `dist/admin.js`: trình sửa cấu hình.
- `dist/data-model.mjs`: kiểm tra cấu hình, quan hệ cấp trên, vòng lặp, URL và giới hạn dữ liệu.
- `preview.mjs`: máy chủ local chỉ lắng nghe trên 127.0.0.1, kiểm tra Origin/Host khi ghi, phát hiện xung đột lưu.
- Font Be Vietnam Pro từ Google Fonts; dùng Arial khi không tải được.
