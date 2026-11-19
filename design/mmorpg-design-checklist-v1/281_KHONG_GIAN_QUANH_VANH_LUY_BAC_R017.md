# 281 · Không gian quanh Vành lũy Bắc — r017

## Vấn đề cần sửa

r016 chỉ bổ sung đạo cụ trong khi bố cục xung quanh chưa sát concept: tán cây che chân vách/bậc, khoảng tiếp cận bị bó hẹp và đầu suối xuất hiện trên mép thềm như một miếng nước cắt ngang đá. Thêm thùng và cờ không giải quyết được ba vấn đề này.

## Thay đổi trong map chơi

- Mở khoảng nhìn dọc chân thềm; dọn 22 đối tượng che lối lên hoặc thuộc bờ suối cũ.
- Chỉnh 29 cây quanh khu Bắc: giảm kích thước tán, thay một phần liễu thành sồi/bạch dương để không còn một dải liễu đồng dạng phủ kín vách.
- Đường tiếp cận Bắc tăng từ 75 lên 110 world pixel; giữ hướng lên cổng và nội suy cao độ thật.
- Đầu suối chuyển từ `(1900,620)` xuống `(1900,990)`, thu hẹp dần ở đầu nguồn; giữ dòng hạ lưu nối sông và bỏ vị trí thác cũ tại thềm Bắc.
- Sân trước cổng mở rộng vừa phải thành ellipse 290 × 140 bán kính; không mở cổng đóng.
- Thêm 24 cụm cây thấp, đá vụn và hoa/cỏ cạnh chân vách theo từng nhóm, tránh hành lang đường đi.

Nguồn: `binh-minh.tmj` và `binh-minh-geology.json`; script tác giả `scripts/north-surroundings-r017.mjs`. Có bản sao r016 trong thư mục history. Không đổi map version6 hoặc reset nhân vật; không sửa thủ thành.

## Checklist và kiểm chứng

- [x] Sửa bố cục thực tế, navigation và dòng suối cùng lúc.
- [x] Giữ nguyên các vùng cao/cơ chế vách, cầu và bậc.
- [x] Chụp lại cảnh Phaser; không có lỗi runtime trong lượt chụp.
- [x] Bộ 36 kiểm thử sẵn có đạt sau thay đổi, gồm 13 đường đi hai chiều.
- [x] Hai kiểm thử riêng về đầu nguồn trên nền thấp và khoảng cây quanh bậc Bắc đạt. Tổng 38 kiểm thử đạt.

## Phạm vi còn khác bản mẫu

Đây là lượt chỉnh bố cục quanh thành, không phải xác nhận giống hoàn toàn concept. Mặt vách vẫn dùng vật liệu hiện có nên độ gồ ghề, silhouette đá và đường viền chưa giống từng chi tiết của tranh mẫu. Công trình trong thành chưa có nội thất. Không coi ảnh concept là collision mask.

[Xem bản mẫu / r016 / r017](http://localhost:3000/design-preview/v01-north-surroundings-r017/index.html).
