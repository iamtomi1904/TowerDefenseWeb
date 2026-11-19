# 286 · Bỏ đạo cụ thừa, sửa thảm tự nhiên trước cổng — r022

Ảnh người dùng khoanh chỉ ra hai sai lệch cụ thể: các đạo cụ không có trong bản mẫu và dải thực vật lặp đều như hàng trang trí. Đây là thay thế nội dung, không chỉ tăng số vật thể.

## Nội dung đã chỉnh

- Gỡ sáu cụm đạo cụ trước thành: hai cột cờ/đèn, giá vũ khí, thùng hàng, bảng chỉ dẫn mái đỏ và máng nước. Không gỡ các vật dụng tương ứng ở Trại Bình Minh.
- Gỡ các dải bụi hoa tròn và khối cỏ/đá lặp đều ở chân tường/mép gò thuộc các lượt trước.
- Tổng66 đối tượng bị loại có nhật ký ID/lý do tại `natural-verge-r022.json`.
- Vẽ bộ6 khối nền thấp: cây bò bất đối xứng, dương xỉ, vài viên đá rêu, cỏ/rễ mép, hoa dại thưa và sỏi rải. Các cụm không có hoa to đối xứng hoặc đất vuông phía sau.
- Đặt31 khối thành những mảng cây không đều với khoảng đất/cỏ lộ ra giữa các mảng. Sỏi được giữ trong thư viện; lượt này chưa đặt xuống cảnh.
- Giữ trống tuyến từ bậc lên cổng, dùng lại contour và collision hiện tại. Không sửa thủ thành hoặc database.

## Quy tắc

Vị trí thực vật bám đường chân tường và những điểm chọn riêng trên mép gò, không lặp một cụm ở mỗi đoạn cùng chiều dài. Mỗi vị trí phải có nền phẳng được hỗ trợ và nằm ngoài mép đường ít nhất20px cộng phần rộng của bụi. Không tự thêm cờ, biển hoặc thùng để lấp vùng trống.

## Checklist

- [x] Gỡ đúng các đạo cụ bị khoanh.
- [x] Gỡ hàng thực vật đều và lưu danh sách thay thế.
- [x] Đặt lại những mảng thấp khác dáng theo khu vực.
- [x] Hoàn thiện atlas và frame cắt thủ công theo các khoảng trống giữa sprite; renderer loại alpha dưới128 để bỏ quầng mờ, không vẽ nền vuông.
- [x] Build/TypeScript đạt;44/44 kiểm thử đạt, gồm bài xác nhận sáu cụm đạo cụ bị loại và các vị trí thảm mới không chắn đường.
- [x] Chụp lại cảnh cuối,40 lớp thành vẫn phủ đủ2140 cột pixel nguồn. Không có lỗi runtime trong lượt tải/chụp.
- [x] Trang đối chiếu tải đủ4 ảnh, không lỗi JavaScript.

Asset: `/mmorpg/assets/natural-verge-r022.png`. Prompt và nguồn imagegen tích hợp: `natural-verge-r022.provenance.json`.

Không khẳng định mọi chi tiết đá/gò đã giống tranh mẫu. Đợt này sửa đúng đạo cụ và thảm thực vật trong các vùng được khoanh ở ảnh mới.
