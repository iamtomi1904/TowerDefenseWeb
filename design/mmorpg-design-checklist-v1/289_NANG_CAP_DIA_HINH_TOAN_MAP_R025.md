# Bình Minh — nâng cấp địa hình toàn map r025

[Xem ảnh trong game](http://localhost:3000/design-preview/v01-terrain-upgrade-r025/index.html)

## Đã triển khai
- [x] Thay vật liệu đường đất toàn map và làm mép pixel bất quy tắc, giữ vùng đi.
- [x] Thay vật liệu đất ẩm, sỏi bờ và đáy suối; hòa mép nước/đất.
- [x] Khai báo 5 đoạn lội theo giao tuyến đường–nước nông, kiểm tra toàn bộ điểm đứng. Đáy sỏi sáng hơn nhưng vẫn có lớp nước.
- [x] 4 cụm bậc nối đúng đầu trên/dưới; thêm 8 chiếu nghỉ.
- [x] Thay vật liệu vách đá và dùng khối đá đứng ở cạnh dốc, tránh kéo sọc mặt trước theo cạnh bên.
- [x] Không đặt khối đá đè hành lang bậc; bỏ 1 đoạn rào vướng tiếp cận.
- [x] Giữ topology 2, layout 6, cao độ và ô va chạm. Không migration database.
- [x] TypeScript và Vite build đạt; 47/47 kiểm tra tự động đạt. Chụp ảnh các vùng bằng tài khoản QA tạm, không có lỗi JavaScript.

## Cơ chế
Mặt trên, vách và chân vách theo polygon có chung đỉnh với dữ liệu địa hình. Nhân vật chỉ chuyển tầng qua liên kết được khai báo. Bậc dùng cùng hai mốc liên kết; ảnh không quyết định cao độ. Nước sâu vẫn chặn, nước nông vẫn làm chậm. Hiệu ứng dòng chảy giữ nguyên. Vật liệu và mặt nạ dựng một lần rồi cắt theo camera, không sinh lại từng frame.

## Phạm vi và phần chưa hoàn tất
- [ ] Chưa có bộ terrain autotile 47/256 mảnh đủ mọi góc; bản này dùng vật liệu, mặt nạ chuyển biên và module vách/bậc.
- [ ] Chưa xác nhận trực quan riêng trên Electron; web/client dùng chung renderer.
- [ ] Góc bậc chéo và các khớp vách cần tiếp tục đối chiếu với ảnh tổng thể; không đánh dấu map đạt độ giống 80% khi chưa có tiêu chí đo.

## Nguồn
Tiếp nối hồ sơ 288: Tiled terrain, Godot TileSet/TileMap và Phaser TilemapLayer. Asset mới riêng cho dự án, không dùng bộ asset có sẵn. Báo cáo nguồn và QA nằm trong public/mmorpg/assets/terrain-upgrade-r025.json và north-camp-qa-r025.json.
