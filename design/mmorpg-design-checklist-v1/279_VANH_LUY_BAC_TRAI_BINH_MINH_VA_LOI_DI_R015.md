# 279 · Vành lũy Bắc, Trại Bình Minh và lối đi — r014/r015

25/10/2026. Đối chiếu ảnh tổng thể Bình Minh đã chốt, sửa vào map MMORPG thật dùng chung web/PC. Không sửa thủ thành; không đặt lại tài khoản, cấp, XP hoặc vật phẩm.

## Vành lũy phía Bắc

- [x] Vẽ và tích hợp khối thành cong liền mạch, tháp, cổng giữa và các mái nhà sau tường theo concept. Thay dãy đoạn tường rời cũ.
- [x] Khối thành rộng 2500 đơn vị, tâm X2760, chân cổng Y500. Giữ vị trí nhãn vùng theo thiết kế.
- [x] Có footprint đa giác chín đỉnh theo chân thành cong, server/client cùng kiểm tra chân nhân vật. Không dùng một hình chữ nhật chắn toàn khoảng đất trước hai cánh thành.
- [x] Tách `at` (điểm nhãn vùng) và `arrivalAt` (điểm đến có thể đứng). Điểm đến Bắc ở2760,560 trước cổng đóng; dev-place dùng điểm này.
- [x] Dọn các cây/đá/vật trang trí nằm trong footprint thành và trục sân trước. Giữ rừng hai bên; chuyển cụm đá chân thềm ra khỏi thân tường.
- [x] Đường lên từ rừng đi về một lối bậc rõ ràng, thay đoạn men theo vách tạo lối dốc quá dài. Sân trước cổng dùng khoảng đất bo tròn, nối với đường.

## Trại Bình Minh

- [x] Giữ năm công trình quanh sân: nhà Bắc, lều tiếp tế Tây, xưởng rèn Đông, kho/nhà Tây Nam, lều y tế Đông Nam.
- [x] Bổ sung metadata bảy khu công việc, gồm lửa trại và giếng; đây là phân khu map, chưa biến chúng thành NPC/chức năng gameplay mới.
- [x] Ghép sân đất chung quanh2160,2420 thay các nhánh đất rời; cùng một raster cho ảnh nền và vùng đi được.
- [x] Dọn cây thấp rải giữa sân; giữ cây/hoa sát cửa và vòng ngoài. Đồ sân có chủ sở hữu được dời cùng công trình khi tránh hành lang đường.
- [x] Giữ cổng ra và rào theo viền gò. Rào ruộng ngoài trại lùi vào mép ô; mở khoảng trống ở đường giữa và giao lộ.

## Sửa đường trên toàn vùng

- [x] Trục lên/xuống cầu gỗ thẳng với mặt cầu; không để đường cong cắt góc ngoài lan can.
- [x] Các nhánh Hốc Rễ, Kho Vôi và Hầm Phong Ấn tới sân trước cửa, không xuyên thân asset cửa hầm.
- [x] Có đường vòng phía Đông tới bãi đá; điểm tuyến lấy từ tìm đường trên traversal thật, giản lược đoạn thẳng chỉ khi đi được cả hai chiều.
- [x] Bảo toàn nước sâu/nước cạn, ưu tiên sông sâu tại chỗ hợp lưu, mặt cầu khô, vách và các vùng cao thấp.
- [x] Căn đầu trên/dưới bậc bằng giao điểm tâm đường với hai đường viền vách, thay mốc chỉ lấy từ hộp bao polygon.

## Lỗi cơ chế phát hiện khi kiểm tra đường

Tâm đường đứng được chưa bảo đảm nhân vật đi qua được: cách chiếu cao độ theo trục giữa từng mảnh vách gây nhảy cao độ tại cạnh chung. Đã đổi sang nội suy theo hai tam giác có chung đỉnh của quad vách. Các cạnh chung có cùng cao độ; không tăng giới hạn bước để che lỗi. Topology lên phiên bản2; cao độ được server tính lại và lưu PostgreSQL theo cơ chế cũ.

## Kết quả kiểm tra

- **35/35 kiểm thử đạt**, gồm đi thực sự bằng `move()` trên cả13 tuyến đường theo hai chiều, lấy mẫu tối đa5 đơn vị mỗi bước, tất cả điểm đến và ba hầm vẫn kết nối.
- Kiểm tra riêng cổng thành đóng, footprint cong, điểm đến ngoài cổng, bốn vị trí từng bị nhảy cao độ và bảy phân khu trại.
- Trình duyệt chụp toàn map, toàn cụm thành/trại và cận cảnh. Báo cáo `/mmorpg/assets/north-camp-qa-r015.json`.
- Kiểm tra WASD từ chân thềm Bắc lên cao128, chặn ở cổng, lưu vị trí/tầng và tải lại qua PostgreSQL: `/mmorpg/assets/north-walk-qa-r015.json`.

## File chính và bàn giao

- `public/mmorpg/maps/binh-minh.tmj`, `binh-minh-geology.json`, runtime map biên dịch.
- `scripts/repair-binh-minh-routes-r014.mjs`, `organize-binh-minh-r014.mjs`, `finalize-binh-minh-bypass-r014.mjs`, `build-north-camp-r015.mjs`, `finalize-north-camp-r015.mjs` là các bước biên tập nguồn; build bình thường chỉ biên dịch TMJ đã chốt.
- `scripts/terrain-topology.mjs`, `src/shared/map-traversal.ts`: height quad và footprint đa giác.
- `src/mmorpg/terrain-art-layout.ts`, `terrain-detail-renderer.ts`, `world-renderer.ts`: căn bậc và khối thành.
- `mmorpg-service.mjs`: dev-place dùng điểm đến có thể đứng.
- `test/mmorpg-north-camp-r015.test.mjs`: hồi quy đường hai chiều, thành, trại, mép dốc.
- Asset mới: `public/mmorpg/assets/north-rampart-r015.png`. Vẽ bằng imagegen tích hợp, tham chiếu ảnh tổng thể; prompt/nguồn trong `north-rampart-r015.provenance.json`.

## Giới hạn

Khối thành hiện là một asset công trình lớn có footprint riêng; chưa có nội thất hoặc cổng mở tương tác. Chưa nghiệm thu toàn map giống80% concept: chuyển tiếp nước, vài mặt vách và bộ hình hướng công trình vẫn cần các lượt riêng. Không coi kiểm thử logic đạt là nghiệm thu toàn bộ mỹ thuật.

Trang xem: http://localhost:3000/design-preview/v01-north-camp-r015/index.html
