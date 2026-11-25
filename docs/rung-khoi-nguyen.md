# Rừng Khởi Nguyên — chế độ phiêu lưu đơn của The World

Triển khai đầu tiên ngày 25/11/2026. Chạy trong web hiện có, không phải Site hoặc
server mới. Trang chủ `http://localhost:3011/` có nút vào `/adventure.html` ở khu vực
mở đầu và thẻ chế độ ở phần Chế độ chơi. Giữ nguyên Giữ Thành/co-op, hướng phát triển
RPG và các cơ chế MMORPG hiện có.

## Ba đường dẫn với mục đích riêng

- `/adventure.html`: game chơi một mình. Giao diện dành cho người chơi, không hiện
  seed/preset, telemetry hoặc nút thử ánh sáng.
- `/openworld.html`: trang thiết kế hiện có, tiếp tục xem/thử thế giới, asset,
  ánh sáng, thời tiết và nhân vật. Có liên kết sang chế độ chơi.
- `/openworld-art/`: thư viện hình và hoạt ảnh, giữ nguyên.

## Vòng chơi thực hiện được

1. Chọn người thám hiểm hoặc lữ khách trùm mũ, vào hành trình.
2. Click mặt đất để đi; click chân cây/đá để tiếp cận rồi thu thập. WASD hủy lệnh
   đi tự động; Shift chạy, Space nhảy, Q/E hoặc kéo chuột xoay góc nhìn, cuộn zoom.
   Di chuyển chuột dùng hướng trực tiếp, chưa có tìm đường quanh mọi chướng ngại;
   sau 8 giây không tới sẽ dừng và hướng dẫn đi vòng bằng WASD.
3. Gỗ, đá, nấm tăng thật trong túi. Chế rìu tốt tốn 4 gỗ + 2 đá, tăng sát thương
   từ 10 lên 20. Sáu cây và bốn tảng đá được bố trí sẵn gần điểm đầu đủ cho rìu/nhà;
   tài nguyên procedural bên ngoài vẫn thu thập được.
4. Xây căn nhà đầu tiên tốn 8 gỗ + 4 đá. Chọn ô đất trống, bằng, không ngập nước,
   cách người chơi 3–9 đơn vị, không đè lên cây/đá/quái hoặc đèn hiệu. Kiểm tra
   mặt bằng 4×3,6 đơn vị. Nhà có va chạm và là điểm hồi sinh/nghỉ ngơi.
5. Đánh slime: 30 HP; có roam/chase/windup/recover/return/dead, giới hạn đuổi,
   kiểm tra cao độ/va chạm, vòng báo đòn 0,6 giây, 14 sát thương mỗi lần trúng.
   Cửa sổ bất tử 0,85 giây ngăn nhiều quái gây sát thương dồn cùng lúc. Chạy ra
   khỏi vùng báo để né; đánh trúng có flash và phản hồi camera/hoạt ảnh.
6. H dùng 1 nấm hồi 35 HP; ở gần nhà hồi đầy miễn phí. Khu đèn hiệu và quanh nhà
   là vùng an toàn. Hết máu hiện menu hồi sinh, giữ túi đồ/nhà, hồi sinh tại nhà
   hoặc đèn hiệu. Bản lưu khi chết không tự cho nhân vật sống lại trước khi chọn.
7. Mục tiêu mở đầu dẫn qua rìu → nhà → hạ 3 slime. Sau đó tiếp tục tự do, không
   khóa thế giới bằng màn kết thúc. Chunk tải dần khi khám phá; thêm slime theo
   sector seed cố định và loại cá thể xa khỏi bộ nhớ. Quái đã chết không sinh lại.

## Lưu tiến trình và ranh giới

`the-world-adventure-v1` lưu một snapshot JSON gồm phiên bản/seed, HP, túi đồ, rìu,
nhà, avatar, vị trí, ID tài nguyên đã thu thập và slime đã chết, trạng thái quái
đang hoạt động. Ghi sau các giao dịch/tương tác, mỗi 5 giây, khi tạm dừng/ẩn trang
và khi rời trang. Cùng một lần ghi chứa cả thay đổi tài nguyên và phần thưởng.
Lỗi storage được hiển thị, vẫn giữ game trong phiên; JSON lỗi trở về khởi tạo an toàn.

Không đọc/ghi bản lưu thiết kế `openworld-progress-v1`, không dùng phần thưởng/thống
kê MMORPG hoặc tài khoản server. Tiến trình này thuộc origin/trình duyệt hiện tại;
`localhost:3011`, `127.0.0.1:3011` và cổng 4174 có kho lưu khác nhau.

Đây là bản chơi đầu tiên: một kiểu nhà có thể đặt, một loài quái, một công thức nâng
cấp dụng cụ. Chưa có nội thất, xây nhà từng mảnh, nhiều biome có nội dung riêng,
cốt truyện dài hoặc chơi nhiều người. Khi mở rộng, giữ bản lưu có phiên bản và tách
quy tắc single-player khỏi quyền quyết định gameplay của server MMORPG.

## Cấu trúc và xác minh

- `src/openworld/adventure-session.ts`: luật chơi thuần TypeScript, không DOM/Three.
- `src/openworld/adventure-controller.ts`: giao diện, cảnh nhà/đồ/quái, điều khiển chuột.
- `src/openworld/main.ts`: tích hợp mode qua `data-mode="adventure"`, dùng chung engine.
- `public/adventure.html`, `adventure.css`: màn hình game; `home-adventure.css`: thẻ trang chủ.
- `tests/openworld-adventure.test.mjs`: trọn vòng gather/craft/build/fight/save/restore,
  chống nhân phần thưởng, tầm/cao độ, đặt nhà sai, telegraph/né đòn/vùng an toàn,
  bất tử ngắn, chết/hồi sinh, JSON lỗi, streaming không hồi sinh quái đã chết.

TypeScript, build và 23 kiểm thử openworld đã đạt. Trình duyệt đi từ trang chủ 3011
vào game, hiện nhân vật người; quan sát túi gỗ/đá tăng, slime bị hạ, HP giảm, rìu tốt
được chế và mục tiêu chuyển sang dựng nhà; reload khôi phục HP/túi đồ/kills. Console
không ghi lỗi trong lần kiểm tra. Vòng xây nhà/khôi phục nhà đã xác minh bằng kiểm
thử luật chơi; việc đặt nhà bằng chuột cần đối chiếu thêm trong browser.
