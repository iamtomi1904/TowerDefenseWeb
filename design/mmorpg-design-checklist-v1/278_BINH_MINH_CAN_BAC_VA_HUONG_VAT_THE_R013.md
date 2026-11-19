# 278 · Bình Minh — căn bậc và hướng vật thể r013

25/10/2026. Sửa game MMORPG web/PC, giữ terrain topology và PostgreSQL r011. Nguồn hình: concept Bình Minh đã chốt; không dùng asset của game khác.

## Bậc lên gò và cảm giác độ cao

- [x] Gom các polygon thực sự chạm nhau; không gộp hai cửa lên chỉ vì cách nhau dưới một khoảng bán kính.
- [x] Căn riêng đầu trên và đầu dưới theo vùng chuyển tầng; lấy chiều rộng đường làm chuẩn cho mặt bậc, không lấy cả vai đá làm mặt đi.
- [x] Dùng ba hướng sprite bậc: chính diện, chéo trái và chéo phải. Ghép bằng hai mốc và phép chiếu, không xoay phẳng toàn hình.
- [x] Tăng đọc khối bằng lớp đất mặt sáng nhẹ, gờ đỉnh có bóng dưới mép và bóng chân vách. Nước và lối chuyển tầng vẫn được cắt theo dữ liệu cũ.
- [x] Mặt bậc nằm dưới lớp nhân vật; vai đá ghép với hai bên vách. Loại một mảnh nối quá nhỏ khỏi danh sách bậc hiển thị đầy đủ.

## Rà soát vật thể lặp

Đã kiểm kê **2702 vật thể runtime, 22 nhóm**. Bộ quy tắc tại `src/mmorpg/object-orientation.ts`; kiểm kê từng nhóm trong `/mmorpg/assets/object-orientation-audit-r013.json`.

| Nhóm | Cách xử lý hiện tại |
|---|---|
| Sồi, bạch dương, liễu, cây ăn quả | 12 sprite: mỗi loài ba góc nhìn/cành/rễ khác nhau. Chọn ổn định theo ID, không đổi hình khi tải lại hoặc di chuyển camera. Gốc và collider giữ nguyên. |
| Hàng rào | Bốn hướng phối cảnh; bám tiếp tuyến đỉnh gò nếu chân rào nằm sát viền, ngoài ra bám hướng rào lân cận. Trụ vẫn thẳng đứng; không xoay toàn hình như vật nằm trên đất. |
| Đá, núi, đá vụn | Dùng đối xứng trái/phải; không xoay 90° làm các khối đứng bị nằm nghiêng. Chưa có bộ hình đủ bốn phía cho từng khối. |
| Cỏ, hoa, cụm cây thấp | Biến thể có sẵn và đối xứng, giữ hướng mọc thẳng. |
| Ruộng, cầu, cửa hầm | Hướng cố định theo mặt bằng, trục cầu và cửa tương tác. Không đổi hướng ngẫu nhiên. |
| Nhà, lều, lò rèn, nội thất có mặt trước | Giữ cửa và mặt chức năng. **Chưa vẽ đủ mặt hông/lưng**; không báo rằng mọi vật thể đã có mọi góc. |
| Đèn, biển, thùng, chậu | Giữ đứng và mặt đọc; cần bộ hướng riêng trước khi đặt ở mặt đối diện. |

## Asset đã tích hợp

- `public/mmorpg/assets/tree-directions-r013.png`: 4 hàng × 3 cột; cây từ nhiều phía.
- `public/mmorpg/assets/fence-directions-r013.png`: 2 hàng × 2 cột; rào ngang, hai chéo, gần dọc. Đã chạy lượt tách nền, runtime chuẩn hóa alpha.
- Bậc dùng ba hình trong `stone-stairs-r012.png`, lần này đã tách thành ba texture và chọn hướng khi ghép.

Vẽ bằng imagegen tích hợp; prompt và nguồn lưu trong `orientation-r013.provenance.json`. Các ảnh `story-*-r013.png` chụp từ game thật.

## Kiểm thử

12/12 kiểm thử liên quan đạt: tách hai bậc gần nhau, nối mảnh tiếp giáp, quy tắc cho mọi nhóm vật thể, nhiều hướng rào, ba góc cây, chặn vách và đi cao–trũng hai chiều. Build TypeScript/Vite đạt. Báo cáo trình duyệt `/mmorpg/assets/orientation-qa-r013.json` kiểm tra hướng thực sự đang dùng và lỗi runtime.

## Chưa nghiệm thu

Mốc nguồn bậc là thông số fitting cần đối chiếu ảnh khi thay asset. Không có xoay 3D liên tục cho sprite; mỗi góc cây là một hình riêng. Các mặt hông/lưng của công trình và bộ góc riêng cho tất cả đồ nội thất vẫn cần sản xuất; đây là giới hạn được ghi nhận qua kiểm kê, không phải đã hoàn thành toàn bộ mỹ thuật map.

Trang kiểm tra: http://localhost:3000/design-preview/v01-orientation-r013/index.html
