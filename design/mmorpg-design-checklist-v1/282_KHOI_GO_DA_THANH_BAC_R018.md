# 282 · Khối gò đá thành Bắc — r018

## Chẩn đoán

r017 dọn cây nhưng vẫn giữ đường mép gò quá đều và vật liệu đá như tường xây; vì vậy không đạt ý đồ bản mẫu. Đợt này sửa cả hình học nguồn và mỹ thuật, không tiếp tục chỉ rải đạo cụ.

## Đã tích hợp

- Viền thềm Bắc có các đoạn nhô/lõm; phần giữa thu lại khoảng sân từ cổng tới mép gò.
- Chân vách phía trước sâu khoảng 170–218 world pixel tùy đoạn. Cao độ nền chơi vẫn là128; độ sâu chiếu của mặt vách không tự tăng chỉ số tầng.
- Đỉnh/chân các mặt dùng chung vertex, polygon collision và dốc được biên dịch lại từ hình học mới.
- Vẽ mới `north-cliff-r018.png`: đá tảng đứng, khe nứt, rễ/cỏ và chân đá vụn. Áp vật liệu theo contour, giữ texture liên tục theo chiều dài.
- Bỏ hai đường kẻ đậm liên tục ở đỉnh/chân riêng khu Bắc để không thành một dải tường viền.
- Dọn vật thể nằm vào mặt vách mới; chuyển bảng chỉ dẫn3607 và máng nước3608 lên sân tại y590.
- Không đổi map version6, không reset nhân vật, không đổi schema PostgreSQL, không sửa thủ thành.

## Checklist

- [x] Đọc lại bản mẫu, sửa tỷ lệ khoảng sân và khối gò.
- [x] Tạo asset pixel bằng imagegen tích hợp, lưu prompt/nguồn tại `north-cliff-r018.provenance.json`.
- [x] Cập nhật region, faces, navigation và topology chung server/client.
- [x] Ghép ảnh vào renderer thật; giữ các khu ngoài thềm Bắc dùng vật liệu cũ.
- [x] Build thành công; 40/40 kiểm thử đạt, bao gồm13 tuyến đường theo hai chiều và điểm nối các mặt vách mới.
- [x] Chụp bản cuối và kiểm tra trang đối chiếu: không có lỗi runtime trong lượt thử.
- [x] WASD đi qua bậc mới, lên nền128, bị cổng đóng chặn; PostgreSQL lưu vị trí/tầng đúng và tải lại giữ nguyên. Bảy kiểm tra đạt; báo cáo `north-walk-qa-r018.json`.

## Đối chiếu còn lại

Không khẳng định đã trùng từng điểm ảnh. Các cụm rừng, đá lẻ và kiến trúc thành vẫn là asset tách ghép; cần đánh giá bằng ảnh toàn khu cùng tỷ lệ thay vì chỉ ảnh cận cổng. Không dùng tranh nền để thay thế map chơi.

[Bản mẫu và trước/sau r018](http://localhost:3000/design-preview/v01-north-landform-r018/index.html).
