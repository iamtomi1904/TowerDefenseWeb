# 277 · Bình Minh — chỉnh mỹ thuật theo thiết kế tổng thể r012

25/10/2026. Mục tiêu: đưa map thật gần concept toàn vùng, đặc biệt lối lên gò. Đây là cập nhật vào renderer game web/PC, không phải chỉ sửa ảnh trang xem trước. Cơ chế tầng đứng r011 tiếp tục dùng nguyên trạng.

## Đã sửa

- [x] Bậc đá mới có đất xen đá, vai đá và cỏ mép; nguồn atlas ba hướng, hiện game dùng hướng chính diện cho các lối lên mặt trước.
- [x] Gom các polygon nối tầng thành một lối lên để ghép một sprite hoàn chỉnh. Loại cách vẽ lại cả cầu thang ở từng mảnh vách gây cắt vuông, méo và lặp bậc.
- [x] Chỉ khoét vách đúng footprint chuyển tầng. Không tô toàn bộ đường đất lên mặt vách.
- [x] Thay vật liệu vách dạng gạch bằng dải đá tự nhiên, rễ/đất/cỏ phía trên. Tọa độ vật liệu chạy liên tục theo đường viền gò.
- [x] Thay bốn loài cây trong map bằng bộ sồi, bạch dương, liễu và cây ăn quả mới theo concept. Giữ gốc cây, vùng va chạm và cơ chế giảm che; cây lay nhẹ quanh chân gốc.
- [x] Ruộng giữ diện tích, giảm kích thước cây trồng bằng cách ghép lại phần lòng ô, giữ viền ruộng.
- [x] Cầu qua mương có hình thân/lan can thay ô nền trống.
- [x] Tường thành Bắc cao hơn, cổng rõ hơn; thay kích thước hiển thị, giữ footprint cũ.
- [x] Chụp lại mười khu trong game và toàn cảnh; có trang xem thiết kế / trước / sau.

## Đối chiếu mục tiêu 80%

Không có phép đo tự động đáng tin cậy biến độ giống hình thành một con số 80%. Chưa nghiệm thu toàn map đạt mốc này. Kiểm tra theo nhóm: bố cục, địa hình, tỷ lệ, silhouette, palette, mật độ và chi tiết nối.

| Nhóm | Đã cải thiện | Còn lệch concept |
|---|---|---|
| Gò trại | Bậc nguyên khối, đá tự nhiên, lối lên khớp topology | Độ gồ ghề hai bên và các mặt quay ngang cần tiếp tục so cảnh |
| Cây | Bốn loài cùng palette vàng–xanh đậm, gốc rõ | Mật độ và biến thể từng cụm chưa sao chép từng cây trong concept |
| Ruộng | Tỷ lệ cây nhỏ hơn, có cầu mương | Concept có kiểu luống và cây khác nhau hơn; chưa mô phỏng canh tác |
| Thành Bắc | Tường/cổng rõ chiều cao hơn | Silhouette vòng thành và công trình bên trong còn khác concept |
| Nhà/lều/lò rèn | Giữ các asset tách và bố cục hiện có | Chưa vẽ lại từng nhà hoặc nội thất |
| Sông/suối | Giữ bờ/nước khớp collision hiện tại | Chưa dựng lại từng vũng sâu, ghềnh và thác theo ảnh |
| Hầm/đá/rừng | Cây mới đồng bộ với cửa hầm hiện có | Một số cụm đá và chân cửa hầm còn cần làm riêng |

## Asset và nguồn

- `public/mmorpg/assets/stone-stairs-r012.png`: atlas bậc đá, có alpha; ba hướng, một hướng đang dùng.
- `public/mmorpg/assets/trees-reference-r012.png`: bốn cây tách riêng trên atlas alpha, được cắt thành texture lúc tải game.
- `public/mmorpg/assets/natural-cliff-r012.png`: dải vật liệu vách tự nhiên, lặp theo contour.

Vẽ bằng công cụ imagegen tích hợp; ảnh tham chiếu là `public/design-preview/v01-complete-map-r001/binh-minh-full-map-r001.png`. Prompt và xuất xứ nằm trong `reference-polish-r012.provenance.json` cạnh asset. Không lấy ảnh của game khác.

## Kiểm tra và giới hạn

Build TypeScript/Vite hoàn tất; 27/27 kiểm thử đạt. Trình duyệt xác nhận 5 cầu thang nằm dưới lớp nhân vật, 392 cây, đủ texture cây/ruộng, alpha bậc sạch và không lỗi runtime. Đo có trễ mạng giả lập: p95 16,67 ms, không frame kéo lùi, 3657 node. Kiểm tra map/di chuyển/địa hình để bảo đảm phần hiển thị không mở thêm lối qua vách hoặc đổi dữ liệu nhân vật. Báo cáo trình duyệt: `/mmorpg/assets/reference-polish-qa-r012.json`. Ảnh chụp thật: `story-*-r012.png`.

Chưa dùng hai hướng bậc chéo trong atlas; chúng là nguồn dành cho bước ráp lối ngang/chéo tiếp theo. Chưa coi bộ map mỹ thuật hoàn tất chỉ vì build hoặc test logic đạt.

Trang đối chiếu: http://localhost:3000/design-preview/v01-reference-polish-r012/index.html
