# 287 · Hốc Rễ lớn hơn và cảnh quan đi kèm — r023

Yêu cầu: tăng kích thước Hốc Rễ trong ảnh người dùng, cân lại chi tiết quanh cửa. Không phóng đồng loạt toàn map.

- Hốc Rễ id336 tăng bề ngang340→510 world pixel, tương đương1,5 lần. Giữ nguyên tỷ lệ ảnh và vị trí chân1980,1130.
- Hitbox dùng lại công thức entrance hiện có, tự tăng theo kích thước mới; không chỉ đổi ảnh.
- Dịch3 cây đang chồng bộ rễ/tán, giữ cùng nền đất thấp, tránh sông và hành lang đường. Ghi từng tọa độ cũ/mới trong `hollow-scale-r023.json`.
- Bỏ5 cụm sỏi lặp trước cửa; ghép2 mảng sỏi nhỏ khác cỡ và1 cụm dương xỉ ở vị trí hợp lệ. Các vị trí dự kiến còn lại bị bỏ nếu vướng nước/vật thể.
- Giữ nguyên điểm tương tác ECO1 ở1980,1170, nội thất hầm và điểm trở ra. Không thêm biển/cờ/thùng trang trí.

## Kiểm chứng

- [x] Build thành công;44/44 kiểm thử hiện có đạt sau thay đổi.
- [x] Đi từ nhánh trước cửa tới điểm tương tác bằng20 bước mô phỏng dùng chung; vào ECO1 và trở ra đúng điểm world thành công.
- [x] Ảnh game không có lỗi runtime trong lượt chụp.
- [x] Lưu ảnh toàn cụm với camera0.65 để thấy đủ tán/rễ; trang trước/sau tải đủ3 ảnh, không lỗi JavaScript.

Nguồn: `scripts/hollow-scale-r023.mjs`, bản sao Tiled r022 trong history. Tái sử dụng sprite Hốc Rễ hiện có; không sinh thêm asset. Không đổi database hoặc thủ thành.
