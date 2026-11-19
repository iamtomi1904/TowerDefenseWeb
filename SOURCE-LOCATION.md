# Game thủ thành web

Project được chép từ `D:\the_world\giu-cong-thanh` vào `D:\New world\TowerDefenseWeb`.

Mở shortcut `Thu Thanh Web.lnk` trong thư mục `D:\New world` để bật server và mở trình duyệt. Địa chỉ chơi là `http://localhost:3011/defense.html`. Lần đầu chọn Tạo tài khoản.

Chạy trực tiếp bằng `npm start` từ thư mục này. Node.js 24 hỗ trợ SQLite local. Dữ liệu tài khoản và trận đấu của bản riêng nằm trong `data/game.sqlite`. Thư viện cài trong `node_modules` của project.

Source và tài nguyên web được giữ đầy đủ, gồm các module dùng chung với giao diện đăng nhập và các chế độ web khác trong project gốc. Bản này khởi chạy vào thủ thành. Tệp cấu hình và cơ sở dữ liệu đang sử dụng ở project gốc được giữ tại vị trí gốc.

Kiểm tra sau khi chép đã xác nhận server, trang đăng nhập và API dùng SQLite local. Bộ simulation.test.mjs hiện đạt 7/10 ca. Ba ca về bản đồ, hoàn thành mười màn và kết thúc khi không phòng thủ còn thất bại. Các file mô phỏng và kiểm thử này trùng hash với project gốc.
