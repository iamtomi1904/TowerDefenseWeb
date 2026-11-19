# 276 · Cơ chế địa hình cao thấp — r011

Ngày 25/10/2026. Phạm vi: MMORPG Bình Minh; không sửa chế độ thủ thành. Đây là sửa cơ chế gameplay, giữ nguyên hình ảnh và map nguồn r010.

## Quy tắc đã tích hợp

- [x] Mỗi nền có mã tầng và cao độ riêng: nền gốc 0, gò trại +64, vùng trũng −64; các vùng khác lấy từ hồ sơ địa hình.
- [x] Vách là ranh giới bị chặn, không tự biến thành dốc chỉ vì hai điểm có cao độ khác nhau.
- [x] Chỉ chuyển tầng qua vùng nối được biên dịch từ lối đi giao với vách. Cao độ thay đổi liên tục trong lối nối; không thể đi ngang ra giữa dốc để nhảy tầng.
- [x] Cầu có mặt đỡ, mã và hai đầu kết nối riêng. Không coi toàn bộ mặt nước là đường đi.
- [x] Kiểm tra vùng đứng ở tâm và các điểm quanh bàn chân; đối chiếu tầng của vật cản trước khi chặn nhân vật.
- [x] Lối tương tác không xuyên qua khác tầng. Di chuyển tính cả độ dốc, không sửa tốc độ animation để giả cảm giác lên xuống.
- [x] Client và server dùng chung bộ luật; server quyết định tầng và cao độ. Gửi Z giả từ client không có tác dụng.
- [x] PostgreSQL lưu XY, `surface_id`, `position_z`, `terrain_revision` cùng lần cập nhật trạng thái. Migration 003 bổ sung cột, không sửa migration cũ.
- [x] Debug hiển thị mã tầng/cao độ/lối nối; lớp địa hình debug cập nhật mỗi 150 ms thay vì dựng lại mỗi frame.

## Kiểm chứng

27/27 kiểm thử tự động: map, di chuyển, hầm, địa hình và các trường hợp mới. Fixture không có hình ảnh chứng minh chặn vách và chuyển tầng là logic độc lập với mỹ thuật.

Kiểm tra game thật bằng WASD và PostgreSQL: 11/11 điều kiện đạt. Đi xuống từ tầng `region-0` (+64), qua ramp tới `region-5` (−64), rồi đi lên lại +64. Server báo chuyển tầng, lưu đúng cao độ và tải lại đúng vị trí. Nhân vật thử vẫn cấp 7, XP 12345. Không có lỗi runtime trong lượt thử.

Báo cáo có cấu trúc: `/mmorpg/assets/terrain-mechanics-qa-r011.json`. Trang xem: `/design-preview/v01-terrain-mechanics-r011/index.html`.

## Cấu hình và file chính

- `scripts/terrain-topology.mjs`: biên dịch nền, vách, lối nối, cầu và lưới tra cứu tầng.
- `scripts/create-binh-minh-map.mjs`: ghép topology vào map runtime; 143 mảnh polygon nối tầng, không phải 143 cầu thang độc lập.
- `src/shared/map-traversal.ts`: luật đứng, di chuyển, độ dốc và tương tác chung.
- `mmorpg-service.mjs`, `migrations/003_mmorpg_ground_contact.sql`: trạng thái authoritative và lưu PostgreSQL.
- `src/mmorpg/network.ts`, `game.ts`, `world-renderer.ts`: đồng bộ và debug trong game.
- `test/mmorpg-terrain-mechanics.test.mjs`: vách, ramp hai chiều, vật cản khác tầng và cầu thật.

Độ cao mỗi tầng hiện 64 đơn vị; bước cao tối đa 18; lưới tầng 5 đơn vị. Nguồn vùng/vách/lối đi nằm trong hồ sơ geology hiện có. Đổi địa hình phải biên dịch lại map, không chỉ đổi hình cầu thang.

## Giới hạn còn lại

- Mỗi XY hiện chọn một mặt đỡ; chưa hỗ trợ đi dưới và trên cùng một cầu tại cùng XY, nhảy hoặc vật lý rơi tự do.
- Đã xác minh tuyến cao–trũng thực tế và bộ kiểm thử; chưa đi thủ công qua mọi đoạn vách trên toàn map.
- Vị trí cũ không còn hợp lệ có thể được cơ chế phục hồi hiện có đưa về trại; không đặt lại cấp, XP hoặc túi đồ.
- Chất lượng hình ảnh không được coi là đã giải quyết trong lần sửa cơ chế này.
