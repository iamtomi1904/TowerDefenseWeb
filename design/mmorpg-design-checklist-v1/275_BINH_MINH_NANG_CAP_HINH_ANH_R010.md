# 275 · Bình Minh — nâng cấp hình ảnh r010

Ngày 25/10/2026. Triển khai trên map MMORPG thật; giữ bố cục 12 vùng, cao độ r009 và tiến trình PostgreSQL. Không sửa thủ thành.

## Thiết kế và phần đã ghép

1. **Sỏi lòng suối:** hạt sỏi nhỏ và nền cát xen đá; giảm hình tròn lặp đều của vật liệu cũ.
2. **Nước cạn:** vật liệu dòng chảy có vệt đứt, phối với đáy sỏi, giảm độ chói để hợp màu cây/rừng. Mương ruộng có lớp nước nhẹ hơn suối.
3. **Nước sâu:** dòng màu xanh trầm hơn, rìa cạn riêng; vẫn dùng đúng polygon nước sâu và vùng chặn hiện có.
4. **Đất bờ:** thêm đất ẩm/rêu/rễ; cỏ mép bờ vẫn dùng đúng vật liệu nền, giữ mốc vật liệu toàn map để hạn chế cắt mảng.
5. **Chuyển động nước:** bọt nhẹ quanh đá trong nước; vệt chảy nhanh ở đoạn suối qua mặt dốc. Gộp dữ liệu cùng một mặt dốc để không vẽ hai hiệu ứng trùng. Đây là dòng xiết, chưa phải hệ mô phỏng thủy lực hoặc thác 3D.
6. **Chân vách:** thêm21cụm cây thấp/hoa/đá theo đường chân của khối. Tránh cổng, dốc và lòng nước.
7. **Nhà và ruộng:**18điểm bố trí bồn hoa/sân và góc làm việc, thu hoạch. Dùng những asset đã có để giữ cùng phong cách, không rải vật thể ngẫu nhiên trên toàn map.
8. **Cửa hầm:**17dấu vết/cụm khảo sát tại ba cửa hầm, gồm đá vụn lối vào, thùng, chậu, củi. Giữ nguyên portal và khoảng tương tác.
9. **Mép đường:** mảnh cỏ nhỏ lấn vào mép đất, cùng texture/tỷ lệ/sắc độ nền. Vẽ gộp thành một path để giảm chi phí compositing khi dựng cảnh.
10. **Cây ven nước:** sậy và cỏ ẩm rung nhẹ quanh chân neo; chỉ cập nhật khi nằm trong camera. Không đổi collider theo chuyển động trang trí.

Tổng cộng thêm82object vào TMJ. Dữ liệu gameplay vẫn dùng bản đồ2702object sau khi compiler thêm4lan can cầu.

## Asset và file

- Mới: `public/mmorpg/assets/water-materials-r010.png`, bộ6vật liệu. Bốn mẫu đang dùng cho sỏi, nước cạn, nước sâu và đất ẩm; hai mẫu còn lại được lưu làm tài nguyên cho lượt sau.
- Prompt và nguồn tham chiếu: `water-materials-r010.provenance.json`. Không dùng asset của game bên ngoài.
- Authoring có kiểm tra revision: `scripts/polish-binh-minh-r010.mjs`. Bản nguồn trước sửa nằm trong `maps/history/binh-minh-v9.tmj`.
- Renderer: `src/mmorpg/terrain-detail-renderer.ts`, `src/mmorpg/world-renderer.ts`.
- Map nguồn: `public/mmorpg/maps/binh-minh.tmj`; runtime JSON và client được build lại.
- HTML: `/design-preview/v01-art-polish-r010/index.html`, ảnh tổng quan và các góc gameplay `story-*-r010.png`.

## Kiểm tra và trạng thái

Đo Chrome với input trễ thêm 160 ms: p95 khung hình ≈16,67 ms, 0 khung hình giật lùi, 4041 scene node; không phải cam kết mọi thiết bị. Kết quả trình duyệt lưu trong `public/mmorpg/assets/art-qa-r010.json`.

- [x] TypeScript/shared/Vite build thành công.
- [x] 10 kiểm thử liên quan đến kết nối các địa điểm, collision vật thể, cầu/hầm, cao độ lên/xuống, replay và nước ở hợp lưu đạt.
- [x] Kiểm tra Chrome với tài khoản tạm; không sửa dữ liệu tài khoản thật.
- [x] Giữ mask cắt mặt vách tại lòng nước, không thêm vách chạy ngang suối.
- [x] Cập nhật Markdown, HTML và ảnh map thật; giữ ảnh r009 để so sánh.
- [ ] Chưa nghiệm thu toàn bộ mỹ thuật map theo từng chi tiết của concept.

Lượt này tập trung vật liệu và bố trí cảnh. NPC chức năng, combat, nhiệm vụ và hệ thời tiết đầy đủ chưa thuộc phạm vi. Chuyển động bọt/sậy là môi trường trang trí, không giả lập một cơ chế gameplay chưa có.
