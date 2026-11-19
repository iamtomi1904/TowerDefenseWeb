# 284 · Khối thực vật và bờ sông trước thành — r020

Chuẩn mỹ thuật: ảnh cắt phía trước tường thành do người dùng gửi. Phạm vi gồm chân tường, mép gò, chân gò và đoạn sông bên phải thành; không coi đây là yêu cầu dịch tiếp vị trí gò.

## Bộ khối thay thế

Vẽ atlas pixel alpha mới gồm8 ô: bụi hoa trắng/vàng; đá xen dương xỉ; cỏ/rễ mép gò; đá tảng phủ rêu; bờ Tây; bờ Đông; góc bờ cong; đá giữa nước có bọt. Cỏ mép gò dùng phần trên của frame để tránh tạo một vách đá nhỏ nổi trên mặt đất. Góc cong được lưu trong thư viện;7 loại còn lại được đặt vào cảnh này.

- 18 cụm sát chân tường theo đường cong của thân thành, chừa cửa cổng.
- 27 cụm ở mép gò và12 cụm đá/cây thấp ở chân gò.
- 18 khối bờ nước theo hai đường mép sông và2 khối đá trong nước.
- Tổng77 đối tượng mới thay86 đối tượng thực vật/bờ cũ trong khu vực. Tắt lớp cây nhỏ ven sông tự rải ở đoạn y<1250 để không chồng bộ mới.
- Mặt nghiêng dốc cạnh sông dùng các khối đá đứng thay cho kéo xiên texture mặt trước thành một dải dài.

## Quy tắc tích hợp

Sprite riêng, không phủ tranh nền lên map. Cụm cây thấp không có collision mới; vách và sông dùng collision thật hiện có. Các khối bờ đặt ở layer dưới nhân vật; bụi/đá thấp sắp theo chân sprite. Không đổi thủ thành, vị trí cổng hoặc schema PostgreSQL.

Đường nước, navigation và cao độ vẫn lấy từ r019. Nước xanh/viền bọt trong sprite là mỹ thuật, không tạo hitbox hoặc vùng nước mới. Giữ bề ngang đường đi, tránh đặt bụi vào lối lên.

## Checklist

- [x] Vẽ atlas theo ảnh người dùng, lưu nguồn và prompt.
- [x] Thay đối tượng Tiled và renderer cũ ở khu vực xác định.
- [x] Build thành công; bộ41 kiểm thử trước đó đạt sau thay đổi nguồn map.
- [x] Kiểm tra riêng77 khối mới đạt; tổng42 kiểm thử đạt. Chụp lại sau sửa mặt nghiêng: không có lỗi runtime trong lượt thử; đủ bốn cụm bậc và389 cây hiện có.
- [x] Trang đối chiếu tải đủ ảnh; atlas1774×887 không có pixel đục cắt qua đường chia ô. Kiểm tra ảnh cận bờ xác nhận không còn dải cỏ che các khối đá đứng do sai thứ tự vẽ.

Asset: `/mmorpg/assets/north-ecology-r020.png`. Prompt/nguồn: `north-ecology-r020.provenance.json`. Tọa độ và số lượng: `north-ecology-r020.json`.

Chưa xác nhận toàn map khớp bản mẫu; đợt này chỉ thay bộ môi trường trước thành và bờ sông liên quan.
