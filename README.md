# CineGo frontend — HTML/CSS/JavaScript

Giao diện độc lập, không dùng Blade hoặc PHP phía ứng dụng. Dữ liệu được lấy qua fetch từ backend Laravel trong repo datvephimBE.

## Chạy tại máy

Bật backend ở cổng 8000 trước. Trong thư mục datvephimFE, dùng PHP có sẵn làm static server:

```powershell
php -S 127.0.0.1:8080 -t .
```

Mở http://127.0.0.1:8080. Giữ cả hai terminal backend/frontend chạy. Không mở index.html bằng file:// vì trình duyệt sẽ không có origin HTTP hợp lệ cho CORS.

Có thể dùng static server khác. Nếu thay cổng hoặc tên miền, cập nhật FRONTEND_URLS của backend.

## Cấu trúc

- index.html: khung giao diện và điều hướng.
- assets/cinema.css: toàn bộ CSS responsive.
- assets/app.js: các trang và gọi API (danh sách phim, lịch chiếu, ghế, đặt vé, tra cứu).
- config.js: URL backend, mặc định http://127.0.0.1:8000/api/v1.

Website dùng hash routing (#/movies/1...), vì vậy hosting tĩnh không cần cấu hình rewrite. Có thể triển khai toàn bộ thư mục lên hosting tĩnh. config.js là file công khai, không đặt mật khẩu hoặc khóa bí mật trong file này.

Vé mới/tra cứu được giữ trong bộ nhớ trang; tải lại trang hoặc đóng tab thì dùng mã vé + email để tra cứu lại. Không lưu dữ liệu khách vào localStorage. Nút in dùng hộp thoại in của trình duyệt để in hoặc lưu PDF.

## Kiểm tra

Mở trang chủ, chọn phim, chọn suất chiếu, chọn ghế, nhập thông tin và xác nhận. Kiểm tra mã vé, tổng tiền, tra cứu lại bằng mã/email, rồi quay lại suất chiếu để thấy ghế đã bị khóa. API phải đang chạy; lỗi kết nối và validation được hiển thị ngay trong trang.

## GitHub

Remote origin đã cấu hình tới https://github.com/thanhviet2004-freelancer/datvephimFE.git trên máy hiện tại. Chạy trong thư mục datvephimFE:

```powershell
git add .
git commit -m "Tach frontend HTML CSS JavaScript dat ve phim"
git push -u origin main
```

Nếu GitHub đã có commit và push bị từ chối, kiểm tra/ghép lịch sử trước; không force push.
