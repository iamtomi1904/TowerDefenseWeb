# Nghiên cứu 5 video ISOCORE và hướng áp dụng cho game

Ngày đối chiếu: 25/11/2026. Nguồn: 5 video JohnBrx do chủ dự án cung cấp,
tổng thời lượng metadata 53 phút 17 giây. Đã đọc hết phụ đề tiếng Anh tự động,
đối chiếu khung hình ở các đoạn kỹ thuật và các mốc được đánh dấu.
Đây là phân tích devlog, không có source Unity hoặc shader gốc của tác giả.
Các đề xuất thiết kế/kiến trúc bên dưới là phần thích nghi cho repository này.
Nội dung tài trợ và lời mời mua sản phẩm không dùng làm tài liệu kỹ thuật.

## 1. Bài học theo từng video

### Cập nhật triển khai 25/11/2026 — phản hồi hành động

Đối chiếu lại phụ đề `video-review/DuxJWwLbtls.en-orig.txt` đoạn 02:12–02:45
và khung hình 02:48. Áp dụng ý tưởng phản hồi vào thu thập của prototype:
rung camera 160 ms có biên độ giới hạn, giảm dần về 0; giữ hoạt ảnh người chơi
45 ms tại impact; thêm chớp hạt ngắn và xoay vệt chém theo hướng mục tiêu trên
màn hình. Đây là thích nghi của dự án, các thông số không phải công thức của tác giả.
Không dừng simulation, đồng hồ thu thập hay việc lưu thưởng. Chưa triển khai combo,
knockback hoặc HP/AI quái trong đợt này.

Chọn tài nguyên kiểm tra vị trí thật của mục tiêu: tầm ngang tối đa 3,6 đơn vị,
chênh cao tối đa 0,65, kể cả khi người chơi đang nhảy. Đây là kiểm tra tầm/cao độ,
chưa phải raycast chống chặt xuyên mọi vật cản. Giữ nguyên save và generator.

Xác minh: TypeScript, build và 18 kiểm thử đạt. Browser tải bản mới, click cây cạnh
nhân vật người làm cây biến mất, nhân vật quay đúng hướng, không có console error.
Các hiệu ứng rất ngắn chưa được đo bằng ghi hình chậm; biên độ/thời gian rung và
trường hợp ngoài tầm/khác tầng đã được kiểm thử tự động.

### A. Chiến đấu và cảm giác trúng đòn — 4:14

[Adding a combat system to my indie game](https://www.youtube.com/watch?v=DuxJWwLbtls&t=1s)

- **00:37–01:00:** mặt nạ bóng theo lớp vẽ để tránh vùng giao nhau bị tô đậm
  nhiều lần; tác giả vẫn ghi nhận trường hợp hai bóng cùng lớp chưa giải quyết hết.
- **01:27–02:04:** dùng nền hành vi sinh vật chung, cấu hình cách di chuyển/mục tiêu
  để thêm loài mới. Đây là nền combat, khác với việc chỉ làm slime nhún lên xuống.
- **02:12–02:45:** phản hồi gồm knockback, combo ba đòn; đòn thứ ba mạnh hơn và
  mới đẩy lùi. Có rung camera khi knockback và dừng thời gian rất ngắn khi trúng.
- **03:05–03:40:** dash theo hướng nhìn, va vào mục tiêu gây hit; spawn quanh người
  chơi và tăng sức ép khi đi xa tâm thế giới.

**Áp dụng:** tách thời điểm bắt đầu, trúng và hồi chiêu; một hit chỉ ghi nhận một lần.
Hit-stop trong bản MMO phải là phản hồi trình bày/local, không dừng thời gian chung.
Combo, dash và knockback cần đọc cấu hình nghề/skill hiện hành. Space đang là nhảy
trong prototype, không tự thay bằng dash. Hình phạt mất túi đồ của video không phải
quy tắc của game này.

### B. Thế giới mở đa dạng và biome — 7:01

[Expanding the open world](https://www.youtube.com/watch?v=7TfQkBfuDuw)

- **00:50–01:29:** chuyển từ pool chunk làm sẵn sang sinh từng thành phần; vẫn đặt
  các cấu trúc quan trọng được thiết kế sẵn rồi sinh phần tự nhiên xung quanh.
- **01:31–02:49:** Perlin tạo vùng nước/rừng liên tục; white noise chọn biến thể tile
  và làm thưa cây trong vùng rừng, tránh mọi ô đều thành cây.
- **03:23–04:39:** nhiều octave cộng chi tiết với tần số cao hơn, biên độ nhỏ hơn,
  rồi chuẩn hóa tổng biên độ. Không chỉ tăng số octave mà quên ngân sách thời gian.
- **04:40–06:07:** lưu trạng thái ô, thay đổi quy luật theo biome; biome có mục đích
  tài nguyên riêng. Tác giả khi đó còn cân nhắc nối biome liền kề hay qua cổng.

**Áp dụng:** giữ seed và lớp thay đổi; tách noise độ cao/nước/cây/quặng. Nhiều preset
chọn bằng dropdown chưa phải một hệ biome liên tục. Rừng, vùng lạnh và sa mạc cần
khác tài nguyên, dấu hiệu cảnh và đường khám phá, không chỉ thay màu nền.

### C. Địa hình cao thấp với hình ảnh 2D — 12:10

[Adding 3D Terrain to my 2D Game](https://www.youtube.com/watch?v=ez68sFkO6Qo&t=468s)

- **01:32–02:38:** tách vị trí logic 3D khỏi vị trí vẽ 2D. Va chạm và tương tác
  dùng thế giới thật, không suy từ tọa độ màn hình.
- **04:21–06:51:** noise chi tiết cộng với một noise/profile cao độ lớn để tạo
  thềm, vách, núi và vùng dưới mực nước. Không lấy các con số phụ đề tự động làm
  cấu hình chuẩn: bản chép lời có các khoảng ngưỡng không nhất quán.
- **07:31–07:48:** viền mép giúp nhận biết vách nhưng chưa giải quyết hoàn toàn cảm
  nhận độ sâu dưới camera orthographic; đoạn sau mốc người dùng chuyển sang sorting.
- **08:01–10:52:** tác giả xử lý sorting 2D bằng trọng số lớp và cắt vật thể cao thành
  lát, rồi thay tilemap để gán thứ tự từng block.

**Áp dụng:** Three.js hiện đã có tọa độ 3D và depth buffer; giữ lợi thế này, không
chép hệ sorting lát sprite của Unity 2D. Cần thêm kiểm tra cùng mặt đất/cao độ cho
hit, tương tác và đường đi. Bóng phẳng hiện tại không phải decal bám vách. Có thể
dùng viền tầng, bóng tiếp xúc, texture mặt đứng và bản đồ cao độ để tăng độ dễ đọc.

### D. Hệ sinh thái, sinh tồn và nội thất — 12:57

[I Turned My Indie Game Into a Living Ecosystem](https://www.youtube.com/watch?v=WgYpjPIWCnY&t=222s)

- **01:18–02:28:** nước trong hơn, sinh đáy nước, đổi màu theo độ sâu; cây ven bờ
  và hoạt ảnh bơi. Không chỉ giảm opacity của một mặt phẳng nước.
- **02:29–04:42:** nền hành vi chung và bộ quản lý quần thể thân thiện/thù địch
  theo chunk; kiểm tra một chunk mỗi khung hình. Mỗi loài có sinh cảnh và công dụng.
  Gần **03:42**, hươu là nguồn da, đồng thời vẫn còn đường lấy da qua rương.
- **05:29–06:04:** ong quanh tổ, bướm ban ngày, đom đóm ban đêm; tái sử dụng lớp
  côn trùng có vòng đời ngắn thay vì mỗi con một hệ riêng.
- **07:18–10:07:** thức ăn phục hồi năng lượng; nhiệt độ tạo ranh giới mềm giữa biome;
  elixir có hiệu lực theo thời gian và hiển thị thời gian còn lại.
- **10:09–11:34:** nội thất là scene riêng; khóa vị trí trong save cần thêm world-space
  ID. **11:48–12:04:** tương tác túi đồ thuận tiện và làm mờ vật cản người chơi.

**Áp dụng:** tách sinh vật nền, sinh vật lấy tài nguyên và quái chiến đấu. Spawn phải
theo môi trường, vùng an toàn và giới hạn quần thể. Năng lượng/nhiệt độ là đề xuất
chưa được tích hợp vào thiết kế nhân vật hiện có; không tự thay mana hoặc tài nguyên
nghề. Nội thất cần namespace riêng trước khi lưu đồ đạc vào nhà.

### E. Hang động, thị trấn và kết nối các hệ thống — 16:55

[I Spent 1000 Days on My Indie Game...](https://www.youtube.com/watch?v=29I27vQM15o&t=33s)

- **01:31–03:55:** hang dùng world-space riêng. Seed hang suy từ seed thế giới và
  vị trí cửa; một dải ngưỡng noise tạo đường hang, noise khác tạo cao độ.
- **04:18–05:32:** loài nghe tiếng động, loài nổ gần và loài đánh xa tạo thử thách
  khác nhau. Quặng quý ở sâu hơn gắn phần thưởng với rủi ro, không chỉ với xác suất.
- **07:25–10:40:** jittered grid theo sector và vùng cấm ở biên quyết định vị trí
  công trình; WFC/frontier collapse quyết định bố cục nhà và đường bên trong.
- **11:16–12:08:** hỗ trợ tay cầm được trình diễn nhưng video không giải thích sâu API.
- **12:10–14:14:** bản đồ dựa vào cao độ/biome/cây, mở dần quanh người chơi và điểm
  kích hoạt; sau đó mở rộng sông, hồ, biển và sinh vật dưới nước.
- **14:26–15:01:** tác giả đánh giá các hệ còn rời rạc, cần kết nối, cân bằng và sửa lỗi.

**Áp dụng:** seed hang nên hash từ ID cửa ổn định và world ID; kiểm tra đường từ
cửa vào đến vùng chơi được bằng flood fill, vì ngưỡng noise không tự bảo đảm liên
thông. WFC cũng không tự bảo đảm mọi nhà có đường tới trung tâm: cần kiểm tra toàn
cục, số lần thử hữu hạn và layout dự phòng. WFC bị bỏ cho đảo ở video cũ nhưng được
dùng lại cho thị trấn; không kết luận một thuật toán tốt/xấu cho mọi loại nội dung.

## 2. Đối chiếu source thật

| Hệ thống | Đang có trong prototype `src/openworld` | Phần chưa có đầy đủ |
|---|---|---|
| Hình ảnh 2.5D | Card sprite, normal map, hai pass ánh sáng, terrain mesh có depth, dither trước nhân vật | Bộ asset/animation đạt chất lượng nghệ thuật của video; bóng bám tầng và chống tô đậm vùng giao |
| Thế giới | Perlin/fBm, noise cây/quặng riêng, candidate toàn cục, spacing qua biên chunk, tải dần | Biome chuyển tiếp trong cùng world; hồ/biển có quy luật; nhiều POI có mục đích |
| Thu thập và hành động | Vung rìu, trễ va chạm 0,22s, flash/rung, slash, hạt lá/đá, bụi, tiếp đất; gió/slime nhún | Inventory thật, công cụ, độ bền và chuỗi chế tạo. Dòng `+2 WOOD` hiện là thông báo, chưa là kho đồ |
| Chiến đấu | `ActionClock` chống commit lặp cho thu thập | HP quái/người chơi, AI, damage, combo, dash, hit-stop, knockback. Slime hiện vẫn là prop |
| Lưu tiến trình | Preset + seed + ID đã thu thập + vị trí, browser storage | World-space ID, túi đồ, nội thất/hang, khám phá bản đồ, lưu server cho MMO |
| Sinh vật/nước | Slime có chuyển động shader; nước và mưa hiển thị | Quần thể, spawn/leash, hành vi loài, bơi, màu đáy theo độ sâu và sinh vật dưới nước |

Không coi nhãn biome trong telemetry hoặc các preset khí hậu là hệ sinh thái đã hoàn
thành. Không coi animation slime, hiệu ứng chém hay con số thông báo là combat,
inventory hoặc kinh tế đã hoàn thành.

## 3. Ràng buộc của game hiện có

- Prototype Three.js ở `src/openworld` đang chạy local/browser. Client MMORPG riêng
  ở `src/mmorpg`, API/service tại `mmorpg-service.mjs` và `server.mjs`. Khi đưa cơ chế
  sang MMO, server phải quyết định HP, hit, spawn, tiêu vật phẩm và thưởng; client vẽ
  hiệu ứng từ kết quả đã xác nhận. Không dùng localStorage làm quyền sở hữu tài nguyên.
- `src/shared/map-traversal.ts` đã có `GroundContact`, surface, ramp, bridge và topology.
  Đây là kiến thức cần đối chiếu cho cao độ/đường đi thay vì tạo quy tắc song song.
- [Combat hiện hành](../design/mmorpg-design-checklist-v1/03_CHIEN_DAU_VA_PHAT_TRIEN.md)
  và các hồ sơ V2 tiếp tục có hiệu lực. Devlog là nguồn tham khảo, không thay catalog nghề.
- [Chết/hồi sinh](../design/mmorpg-design-checklist-v1/104_COMBAT_13_CHET_VA_HOI_SINH.md)
  đã quy định không đổi phạt chết thành mất trang bị; không chép cơ chế xóa túi đồ.
- [Sinh cảnh và quái](../design/mmorpg-design-checklist-v1/182_MAP_12_SINH_CANH_QUAI_DONG_VAT_VA_BOSS.md)
  đã có giới hạn V01 không quái bay, vùng an toàn và server quản lý cá thể. Không đưa
  đầu lâu bay hoặc công thức tăng quái theo bán kính trong video vào mọi vùng.

## 4. Thứ tự triển khai đề xuất

Đây là đề xuất từ việc đối chiếu source, chưa phải các tính năng đã triển khai.

1. **Một vòng chơi có ý nghĩa:** inventory thật → thu thập nguyên liệu → chế một
   công cụ → dùng công cụ lấy tài nguyên/đánh một loài → quay về điểm an toàn và lưu.
   Tiêu chí: tài nguyên tăng/giảm thật, tải lại không nhân đôi, người chơi có mục tiêu
   tiếp theo. Ưu tiên việc này trước thêm hàng chục loại hạt/ánh sáng.
2. **Combat một loài hoàn chỉnh:** dữ liệu loài, idle/roam/aggro/attack/return/dead,
   hitbox cùng mặt đất, damage một lần mỗi swing, telegraph và phản hồi. Thử combo/dash
   trên kit phù hợp; dash không xuyên vách hoặc tầng không có đường. Tách time của
   animation/hiệu ứng khỏi tick có quyền quyết định gameplay.
3. **Biome và dân số:** cùng seed sinh vùng nhất quán, tài nguyên phù hợp sinh cảnh,
   giới hạn quần thể/chunk và vùng cấm spawn sát người chơi. Không sinh bù vô hạn
   chỉ vì unload/load hoặc reconnect. Chỉ thêm vài loài có vai trò khác nhau trước.
4. **Đọc cao độ và nước:** dấu mép/vách, bóng đúng mặt đất, màu theo độ sâu, hoạt ảnh
   bơi và vật thể ven bờ. Kiểm tra người ở sau cây, dưới vách, trên cầu và ở tầng khác.
   Tách "nước nhìn trong" khỏi gameplay bơi/năng lượng.
5. **Namespace world-space rồi mới nhà/hang:** khóa định danh tối thiểu gồm world ID,
   space ID, chunk/cell và entity ID. Lưu vị trí cửa ra/vào, trạng thái tài nguyên,
   discovery. Sau đó làm một hang hoặc một nhà có đầy đủ vòng đi/về trước.
6. **POI và định hướng:** vị trí POI theo sector, khoảng cách tối thiểu, kiểm tra
   địa hình/đường tiếp cận; map mở dần. Thử prefab nhỏ có quy tắc trước khi làm town
   WFC lớn. Thị trấn cần có hoạt động/dịch vụ, không chỉ thêm nhà trang trí.

## 5. Hợp đồng kỹ thuật nên giữ

- **Simulation → events → presentation:** sự kiện hit chứa action ID, target ID,
  tick và vị trí 3D/space. Một event chỉ trao thưởng một lần; hiệu ứng không tự đổi HP.
- **Sinh có seed và lưu phần thay đổi:** thêm phiên bản generator/save và kế hoạch
  chuyển đổi trước khi đổi quy luật tạo ID hay bố cục đã lưu. Giữ world-space riêng
  cho hai hang/nhà có cùng tọa độ local.
- **Ngân sách:** hạn chế số mob/particle, thời gian tạo chunk và số lượt WFC thử lại.
  Đo cold start, đi qua biên chunk, quay về vùng cũ và cảnh rừng đông; không chỉ đo FPS
  đứng yên. Tải một chunk/frame không phải bảo đảm frame không khựng.
- **Mỹ thuật:** cùng camera, mật độ pixel, palette và ánh sáng khi so khung hình.
  Shader không thay thế một bộ sprite có silhouette và animation nhất quán. Chất lượng
  art hiện tại là bản thử, chưa khẳng định ngang với asset trong video.

## 6. Bộ kiểm tra khi làm từng bước

- Damage/thưởng không lặp khi spam click, frame rate thấp, reconnect hoặc unload.
- Dash/attack không xuyên wall hoặc đánh mục tiêu sai tầng; collider không theo tán/bóng.
- Cùng seed/space cho cùng kết quả, độc lập thứ tự tải và tọa độ âm.
- Mob cap vẫn đúng sau chết/chuyển chunk; loài trên cạn không sinh dưới hồ/sàn.
- Nội thất/hang thoát được, trạng thái hai space không ghi đè nhau; cave có đường từ cửa.
- Map chỉ mở phần đã khám phá; POI được đánh dấu lại đúng sau load.
- UI thể hiện cái đã tồn tại: vật phẩm thật, HP thật, trạng thái/đường thoát đọc được.

Tài liệu kỹ thuật và lệnh kiểm tra prototype hiện tại: [openworld-25d.md](openworld-25d.md).
