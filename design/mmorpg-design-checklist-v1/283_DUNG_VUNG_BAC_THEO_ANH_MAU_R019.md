# 283 · Dựng vùng Bắc theo ảnh mẫu — r019

## Chuẩn đối chiếu

Dùng ảnh gốc `binh-minh-full-map-r001.png`, kích thước1448×1086. Quy về world6000×4500 bằng tỷ lệ6000/1448, cùng tỷ lệ4:3. Các pin phần trăm trong map-design.json là chú thích gần đúng, không dùng làm chuẩn thay cho hình ảnh.

Đường viền gò và mốc cổng/bậc được đọc thủ công từ ảnh. Ghi đầy đủ tại `/mmorpg/assets/north-reference-r019.json`; đây không phải segmentation tự động hoặc xác nhận khớp điểm ảnh.

## Bố cục đã sửa

- Gò giới hạn từ khoảng x1616 thay vì kéo về x0; vùng rừng Tây không còn bị bờ vách chia ngang.
- Cổng chuyển về mốc ảnh `(739,105)`; điểm đến trước cổng `(739,121)`.
- Bậc đọc từ mốc ảnh đỉnh `(716,179)` và chân `(713,236)`; đường tiếp cận được nối lại tới các mốc này. Topology dùng giao thực tế giữa road và faces.
- Thu khoảng sân, chuyển sáu đạo cụ thuộc cụm thành theo vị trí thành.
- Rừng Tây Bắc có mask theo ảnh; bổ sung46 sồi/bạch dương nhỏ150–199 world pixel, tránh nhà, gốc cây cũ và đường đi.
- Bỏ đối tượng nằm vào vách hoặc hành lang đường mới, bao gồm tảng đá3156.

## Cách duyệt

Trang r019 hiển thị bản mẫu và game cùng tỷ lệ, có thanh trộn hai ảnh. Chụp toàn cảnh bằng camera zoom0.19, canvas1200×900, tâm3000×2250; world nằm trong rect30,22.5,1140,855. Chỉ dùng rect này để đối chiếu, không kéo giãn riêng từng khu hoặc di chuyển ảnh để giả khớp.

Chưa duyệt toàn map giống mẫu. Lượt này chỉ sửa khung vùng Bắc; các khu còn lại và asset thành vẫn có khác biệt. Không thêm đạo cụ hay vẽ lại hình trang trí trong đợt này.

## Checklist

- [x] Lưu các mốc đo và đường viền nguồn.
- [x] Dựng lại vùng cao, faces, đường và nav trong map chơi.
- [x] Dời cụm thành và điểm đến theo mốc mới.
- [x] Chỉnh rừng Tây và dọn xung đột đường.
- [x] Build thành công; 41/41 kiểm thử đạt, bao gồm13 đường đi theo cả hai chiều và mốc/contour từ ảnh mẫu.
- [x] Chụp lại map trong Chromium: không có lỗi runtime. Trang trộn ảnh, chọn toàn map/vùng Bắc và lớp đường viền hoạt động; ảnh/canvas tải đầy đủ.

Không chạy lại bài WASD/PostgreSQL của r018 với tọa độ cũ; kết quả đó thuộc phiên bản trước. Lượt này kiểm chứng di chuyển bằng bộ mô phỏng dùng chung server/client và lượt tải game thực tế.

Không đổi version tiến trình6, schema database hay hệ thủ thành.
