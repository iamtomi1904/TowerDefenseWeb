# 285 · Các vùng khoanh đỏ trước thành — r021

## Các điểm trong ảnh người dùng

1. Dải cây/hoa/đá liên tục sát cả hai cánh tường, chỉ mở ở cổng.
2. Mép gò và khối đá phía trước, không phải một hàng bụi rời ở mặt bằng.
3. Cụm cây thấp/trung bình che một phần chân vách bên trái.
4. Sườn đá cao bên phải hạ xuống bờ sông, có đá chân vách và thảm thực vật.

## Nguyên nhân thực tế và sửa đổi

Thành r020 là một sprite có depth duy nhất tại chân cổng. Các bụi ở hai cánh cong có tọa độ chân nhỏ hơn depth này nên phần lớn bị thành vẽ đè. Việc chỉ thêm bụi không giải quyết được lỗi.

- Chia sprite thành40 dải đứng bằng frame texture dùng chung, không sinh40 ảnh bitmap mới. Mỗi dải lấy depth theo đường chân cong của tường. Các mép frame liên tiếp dùng cùng tọa độ nguồn và tỷ lệ để tránh bỏ/mất cột pixel.
- Dải cây sát tường hiện đúng phía trước từng đoạn, vẫn chừa tuyến vào cổng. Thêm19 cụm bụi/đá thấp để dải thực vật có chiều sâu.
- Thêm5 sồi nhỏ xen đá ở vùng trái theo các vị trí nền khô hợp lệ; không đặt cây xuống nước hoặc chắn đường.
- Các khối đá đứng ở sườn phải được fit chiều cao từ đỉnh xuống chân mặt vách, thay vì chỉ dùng tỷ lệ sprite khiến đỉnh đá thấp hơn mép gò.
- Tái sử dụng bộ khối pixel r020. Không tạo thêm atlas hoặc thay đổi hệ chiến đấu/thủ thành.

Tổng24 đối tượng mới. 14 vị trí dự kiến bị bỏ vì nước, vật thể có sẵn hoặc hành lang đường đi. Không tự ý tạo lối mới hoặc thay đường sông.

## Checklist

- [x] Đối chiếu bốn vùng khoanh đỏ.
- [x] Sửa thứ tự vẽ và cách ghép thân thành.
- [x] Thêm cụm thực vật trái và lớp bụi trước tường.
- [x] Fit chiều cao khối đá bên sông.
- [x] Build thành công;43/43 kiểm thử đạt. Khoảng trống bậc kiểm tra theo mốc r019; có bài riêng về va chạm gốc cây mới và khoảng cách tới đường.
- [x] Browser xác nhận40 lớp tường, độ chênh depth294.32 world pixel; tổng2140 cột pixel frame khớp2140 cột nguồn, không thiếu cột. Không có lỗi runtime trong lượt chụp cuối.
- [x] Trang đối chiếu tải đủ5 ảnh, bao gồm ảnh khoanh đỏ của người dùng; không có lỗi JavaScript.

## Giới hạn

Không xác nhận toàn cảnh đã trùng bản thiết kế. Khối gò vẫn dùng contour r019 và vật liệu r018/r020; mức nhô/lõm, mật độ cây và hình từng tảng đá còn khác tranh mẫu. Lượt này xử lý lỗi lớp vẽ và các cụm môi trường mà người dùng chỉ rõ, không dùng số kiểm thử làm điểm đánh giá mỹ thuật.

Nguồn đặt vật thể: `scripts/north-marked-regions-r021.mjs`. Tọa độ/điểm bỏ: `/mmorpg/assets/north-marked-regions-r021.json`.

[Đối chiếu r021](http://localhost:3000/design-preview/v01-marked-regions-r021/index.html).
