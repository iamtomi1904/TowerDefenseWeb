# 280 · Chi tiết sinh hoạt và phòng thủ — r016

Phạm vi: map MMORPG Bình Minh cấp 1–10. Bổ sung chi tiết vào map thật, giữ hệ địa hình r015 và tiến trình nhân vật. Không sửa thủ thành.

## Bố trí theo công năng

| Khu | Chi tiết và ý nghĩa |
|---|---|
| Lều tiếp tế Tây | Thùng hàng, bao vải, bảng chỉ dẫn và máng nước; thể hiện đầu mối tiếp nhận vật tư. |
| Lều y tế Đông Nam | Bàn thuốc có cối giã, chai lọ, băng cuộn; luống dược thảo sát bên. |
| Xưởng rèn Đông | Giá vũ khí, giỏ than, dụng cụ, củi và nước; đặt ngoài miệng lò và cửa xưởng. |
| Nhà chỉ huy Bắc | Bảng tin có sơ đồ tuyến đường; cột đèn/cờ giúp nhận biết khu chỉ huy. |
| Nhà dân Tây Nam | Luống rau/dược liệu và củi; tách đồ sinh hoạt khỏi sân dùng chung. |
| Thành Bắc | Cột đèn/cờ hai phía tiền đình, vật tư phòng thủ, giá vũ khí, bảng chỉ dẫn và điểm lấy nước. |

Tổng cộng **20 cụm đạo cụ**, sử dụng **8 sprite mới**. Hai vị trí dự kiến bị loại vì không tìm được nền cùng tầng đủ thoáng. Danh sách tọa độ chính xác: `/mmorpg/assets/detail-layout-r016.json`.

## Quy luật dựng cảnh

- Mỗi món có chủ thể sử dụng và khu công năng; không rải ngẫu nhiên để lấp sân.
- Vật thể đứng thẳng theo góc nhìn pixel 2.5D; không xoay phẳng sprite để giả hướng khác.
- Footprint rộng 64% bề ngang và sâu 16% bề ngang, tách khỏi chiều cao ảnh; server và client đọc cùng cấu hình.
- Kiểm tra bốn góc footprint cùng tầng, có nền đỡ, không đè vật thể cũ; giữ khoảng cách tối thiểu 18 world pixel ngoài mép các tuyến đường.
- Giữ 13 tuyến đường và cơ chế cầu, bậc, vách, lưu tầng PostgreSQL hiện có.
- Bàn thuốc, giá vũ khí và bảng tin trong đợt này là **đạo cụ môi trường**, chưa phải NPC hay chức năng cửa hàng mới.

## Checklist

- [x] Thiết kế tám loại đạo cụ dựa trên công năng và bản mẫu.
- [x] Vẽ atlas pixel có nền alpha, tách texture khi tải.
- [x] Tích hợp 20 cụm vào nguồn Tiled và runtime game.
- [x] Tạo footprint collision cho toàn bộ đạo cụ mới.
- [x] Kiểm tra build, 13 tuyến đường hai chiều và ảnh gameplay sau khi ghép.

Kết quả: `npm run mmo:build` thành công; **36/36 kiểm thử đạt**. Chụp lại cảnh thật trong Chromium: không có lỗi runtime, giữ 362 cây, bốn cụm bậc và đủ ba hướng cây/bốn hướng rào. Lượt này không chạy lại kiểm tra lưu PostgreSQL bằng WASD; không sửa schema, topology hay công thức di chuyển.

## Giới hạn

Đây là một lượt hoàn thiện chi tiết thành Bắc và Trại Bình Minh. Không coi toàn bộ map đã khớp 80% concept: tỷ lệ cảnh, nước, mặt vách và các hướng nhìn công trình vẫn cần đối chiếu riêng. Không biến các vật trang trí thành tính năng gameplay chưa triển khai.

Atlas: `/mmorpg/assets/camp-details-r016.png`. Prompt và nguồn tạo ảnh bằng công cụ imagegen tích hợp: `/mmorpg/assets/camp-details-r016.provenance.json`.

Xem: [Đối chiếu r016](http://localhost:3000/design-preview/v01-detail-pass-r016/index.html).
