# 288 · Nghiên cứu nâng cấp địa hình nhiều tầng, đường và chỗ lội

Trạng thái: **nghiên cứu source và đặc tả thiết kế**, chưa đổi renderer/map gameplay trong lượt này. Không phải bộ asset đã vẽ hoặc kết quả mỹ thuật đã nghiệm thu.

## 1. Kết luận

Không nên tiếp tục đặt một ảnh cầu thang lên một dải đá rồi thêm cây để che chỗ nối. Một tầng địa hình phải được dựng thành một khối có mặt trên, mép, mặt đứng, chân vách và đường nối tầng cùng nguồn hình học. Dùng các module nối cạnh/góc được thiết kế đồng bộ để ghép hình; giữ topology và server quyết định chỗ đi được.

Đây là đề xuất áp dụng cho game hiện tại, không yêu cầu đổi Phaser sang engine khác.

## 2. Nguồn tham khảo chính thức

- [Tiled — Using Terrains](https://doc.mapeditor.org/en/stable/manual/terrain/): phân biệt bộ nối góc, nối cạnh và bộ kết hợp; bộ góc/cạnh hai terrain đầy đủ có16 tile, bộ kết hợp đầy đủ256, có thể dùng bộ rút gọn47 tile kiểu blob. Terrain Brush chọn mẫu dựa trên thông tin nối của tileset, không tự biến ảnh rời bất kỳ thành tile khớp nhau.
- [Godot — Using TileSets](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilesets.html): atlas, kích thước ô, padding và hình collision/navigation tách được cấu hình cùng bộ tile. Tham khảo cách tổ chức dữ liệu, không đưa Godot vào dự án này.
- [Godot — Using TileMaps](https://docs.godotengine.org/en/stable/tutorials/2d/using_tilemaps.html): tham khảo terrain matching và tổ chức nhiều layer.
- [Phaser — TilemapLayer](https://docs.phaser.io/api-documentation/class/tilemaps-tilemaplayer): cơ sở tổ chức layer trong engine đang dùng. API layer không tự giải quyết việc ảnh/vùng collision khác nhau.

Không sao chép asset của game khác. Những lựa chọn cụ thể bên dưới là thiết kế cho Ẩn Thành, không phải khuyến nghị được các nguồn này viết sẵn cho game.

## 3. Chẩn đoán source hiện tại

| Thành phần | Hiện trạng đọc từ source | Hệ quả |
|---|---|---|
| `world-renderer.ts / buildRoads()` | Lấy ô navigation ID2, truy đường biên, bo góc, đổ cùng một texture đất; viền là các mẩu cỏ nhỏ | Sân/đường dễ thành dải đất cùng chất liệu, mép vẫn cứng và có nhịp lặp. Navigation không mô tả đất khô, đất ẩm, mòn nhiều hay lối nhỏ. |
| `terrain-detail-renderer.ts` | Vách bị cắt thành dải texture, mặt bên dùng đá sprite ghép đè; các mặt có depth theo nhiều quy tắc | Một số hướng bị kéo xiên, khoảng ghép lộ và bóng/đỉnh/chân chưa cùng phong cách. |
| Cầu thang | `stairCrossings()` ghép polygon đúng về kết nối, nhưng renderer fit một ảnh vào hai anchor nguồn ước lượng | Bậc có thể đi được nhưng hai chiếu nghỉ không ăn vào nền; ảnh mang cỏ/đá thừa gây mảng cắt. |
| Bờ nước | Nhiều polygon bank/bed/water và sprite rải cạnh | Có phân lớp logic nhưng đường viền mỹ thuật chưa có đủ module đất–bùn–sỏi–nước khớp góc. |
| Chỗ lội | Nước cạn là một loại mặt đi được; chưa có kiểu hình riêng cho giao đường–suối | Người chơi không nhìn ra đoạn nên băng qua. |
| Tầng đứng | Đã có floor, height, barrier, ramp và bridge trong `terrain-topology.mjs`/`map-traversal.ts` | Giữ và mở rộng dữ liệu này; không bỏ cơ chế đang hoạt động để thay bằng tranh nền. |

Không kết luận có lỗi FPS hay database từ các ảnh này. Các lỗi mỹ thuật không được đánh dấu đã sửa chỉ vì kiểm thử di chuyển đạt.

## 4. Hợp đồng một khối địa hình

Mỗi khối gồm `surfaceId`, level, height, contourTop, contourFoot, material, edgeType, hướng mặt, transitionIds, các socket mép và collision. Đỉnh/chân các mặt lân cận phải dùng chung điểm nối; phần nghệ thuật và navigation cùng đọc khối này.

### Các lớp hình cần có

1. **Mặt nền trên**: cỏ/đất/đá, đủ rộng để người chơi thấy đang đứng trên một bề mặt.
2. **Mép trên**: cỏ lấn, rễ hoặc đá lộ; có mẫu thẳng, góc lồi, góc lõm và kết thúc.
3. **Mặt đứng**: đá/đất có chiều cao nhất quán theo số tầng, hướng sáng và góc nhìn tương ứng.
4. **Chân vách**: bóng tiếp xúc, đất vụn và đá nhỏ; không phải đường viền đen đều.
5. **Nền dưới**: bắt đầu sát chân vách, không có khoảng rỗng hoặc hai nền chồng nhau.
6. **Đường nối tầng**: bậc/dốc được khoét đúng vào khối và có chiếu nghỉ trên/dưới.
7. **Vật thể sở hữu tầng**: rào, cây, nhà gắn mặt đứng của chân nó; không lơ lửng trên đường mép hoặc kéo xuyên lối lên.

### Cao độ và tỷ lệ

- Giữ height hiện có64 world pixel/tầng và maxStep18 trong giai đoạn thử; không âm thầm đổi tốc độ đi, save hoặc tầng đứng.
- Chọn một tỷ lệ chiếu đứng duy nhất cho bộ terrain thử. Mức đề xuất để dựng mẫu:64 cao độ logic tương ứng96 pixel hình học mặt đứng; đây là tham số thiết kế cần đánh giá bằng cảnh mẫu, chưa áp vào game.
- Không tự trừ height lần nữa khỏi vị trí actor: game hiện dùng tọa độ mặt bằng đã bố trí để vẽ. Nếu đổi sang phép chiếu world XYZ thì phải có migration tọa độ riêng, ngoài phạm vi lượt nghiên cứu này.
- Tầng0/1/2 phải có cùng ngôn ngữ đá/đất; vách hai tầng ghép bằng dải thân, không phóng dãn cả mép cỏ và đá vụn lên gấp đôi.

## 5. Cầu thang đúng cấu trúc

Một prefab có ba phần: **chiếu nghỉ dưới → dãy bậc → chiếu nghỉ trên**. Hai chiếu nghỉ là vật liệu nối với đúng nền ở hai phía; không nhúng nguyên mảng cỏ hình chữ nhật trong sprite bậc.

- Khai báo socket trên/dưới/biên tread trong metadata asset, không dùng mãi tỷ lệ `.2`/`.86` ước lượng.
- Khoét aperture của vách theo cạnh dãy bậc; hai vai đá là nắp kết thúc thật của vách, không đặt một khối đá lên để che lỗ.
- Bề rộng tread theo lối đi; vai đá nằm ngoài collision hành lang.
- Có phiên bản cho một và hai tầng; nếu cao hơn thì thêm chiếu nghỉ giữa, không kéo dài cùng một ảnh.
- Hướng chính của map thử: nhìn trước, chéo trái, chéo phải. Khi bản đồ cần hướng sau/hai bên thì vẽ đúng góc tương ứng; không xoay phẳng bitmap90 độ.
- Hàng rào kết thúc trước vai bậc và có cọc kết thúc. Không đặt một panel rào lên mép cỏ rồi coi là xong.
- Gió/hoa là lớp phụ, không che cả nơi tiếp giáp cần duyệt.

## 6. Đường đất cần thiết kế lại

Tách **hành lang có thể đi** khỏi **vệt đất nhìn thấy**. Vẫn phải giữ phần mặt đất nhìn như đi được không bị blocker bất ngờ; thảm cỏ bên cạnh có thể đi nếu gameplay cho phép.

- Lõi đất nện có biến thể mòn, sỏi mịn và đất ẩm; không dùng cùng độ vàng cho mọi tuyến/sân.
- Dải chuyển đất–cỏ có cạnh/góc và đoạn cỏ lấn, thay vì rắc một chuỗi ô cỏ cùng nhịp.
- Bề ngang thay đổi nhẹ theo địa điểm; không giảm dưới hành lang va chạm đã duyệt.
- Ngã ba/ngã tư có mảng giao riêng, không để các dải tròn đè nhau thành bướu.
- Đường kết thúc tại ngưỡng cửa/chiếu nghỉ; sân cổng và đất mòn quanh cửa phải có hình được tác giả chủ động đặt.
- Biến thể có seed theo vị trí và được cache theo chunk; không ngẫu nhiên lại mỗi frame.

## 7. Lối lội phải nhìn khác suối thường

Lối lội là một **giao cắt được tác giả khai báo**, không suy ra mọi giao đường–nước đều được đi.

| Thành phần | Suối thường | Đoạn lội |
|---|---|---|
| Đáy | màu xanh và đáy có độ sâu khác nhau | lộ sỏi sáng, nước mỏng trong, giảm độ phủ xanh |
| Dòng chảy | các vệt dòng chính | gợn ngắn quanh đá, không tạo thác lớn vô lý |
| Lối tiếp cận | bờ có cỏ/sậy | đất ẩm và sỏi dẫn xuống hai mép, bỏ sậy chắn giữa |
| Cảnh báo hình | không có hướng dẫn đi qua | hai đầu lối cùng ngôn ngữ vật liệu, đọc được khi không có chữ |
| Cơ chế | theo loại nước hiện tại | giữ mức chậm nước cạn hiện có, chưa đổi công thức |

Không dùng một dải đất khô vẽ xuyên suối để giả lối lội. Sông sâu vẫn không đi được; chỉ cầu hoặc lối đặc biệt được thiết kế mới cho qua.

## 8. Bộ module cần vẽ trước khi áp đại trà

Đơn vị đề xuất cho cảnh thử: tile nghệ thuật32px, hiển thị nguyên lần; grid va chạm5px hiện tại độc lập. Thử ở scale2 trước, không ép toàn bộ world phải chia hết64.

| Bộ | Thành phần bắt buộc |
|---|---|
| Đất–cỏ | lõi vật liệu, cạnh4 hướng, góc lồi/lõm, đoạn hẹp, ngã rẽ, biến thể cỏ lấn |
| Vách | mép trên, thân một tầng, thân nối tầng, chân, góc lồi/lõm, đầu kết thúc, hướng trước/trái/phải |
| Bậc | ba góc nhìn × một/hai tầng; socket trên/dưới, hai vai, chiếu nghỉ tương ứng |
| Bờ nước | cỏ→đất ẩm→sỏi→nước cạn, góc lồi/lõm, bờ thấp, chân vách tiếp nước |
| Lối lội | đáy sỏi, hai đầu dốc bờ, gợn nước, đá nhỏ; mask giữ dòng nước liên tục |
| Vật thể mép | rào có đầu/cổng/góc, cọc theo đúng hướng; rễ và đá vụn bổ sung |

Tiled terrain matching là cơ chế chọn tile khớp cạnh/góc. Không gọi một atlas vài ảnh rời là bộ autotile đã hoàn thành; phải kiểm hết các mẫu cần dùng và quy tắc thiếu mẫu.

## 9. Thứ tự áp dụng cho Bình Minh

1. **Khoá mẫu thử**: đúng đoạn bậc ở ảnh mới và đoạn đường lội gần Hốc Rễ; chưa sửa cả map.
2. **Dựng khối thuần hình học**: hiển thị nền trên/dưới, vách, aperture và landing bằng màu riêng; kiểm tra đi lên/xuống và hai bên vai.
3. **Vẽ bộ module chuẩn**: preview tất cả hướng, góc, một/hai tầng, nối hai vật liệu. Giữ phong cách pixel2.5D hiện tại.
4. **Ghép cảnh mẫu**: không dùng cây che lỗi; chụp ở100% và camera gameplay, đối chiếu ảnh thiết kế.
5. **Thử lối lội/đường**: đọc được hai đầu lối, mép không cắt vuông, nước vẫn chảy xuyên đoạn.
6. **Kiểm tra kỹ thuật**: source/collision/ảnh thống nhất; server/client cùng tầng, không xuyên vách, qua cầu không rơi nước; đo frame time trước/sau cùng cảnh.
7. **Chuyển từng cụm**: gò trại → thềm Bắc → bờ hầm → vùng trũng; giữ bản sao nguồn và không reset nhân vật.

## 10. Tiêu chí duyệt bắt buộc

- [ ] Nhìn được mặt nền trên và mặt nền dưới khi bỏ toàn bộ cây trang trí.
- [ ] Không có vách chỉ được nhận ra nhờ một ảnh cầu thang.
- [ ] Đỉnh/chân liên tục ở đoạn nối và góc; không có mảng vật liệu hình vuông lộ ra.
- [ ] Tread chạm cả hai landing; vai bậc nối khít nắp kết thúc vách.
- [ ] Rào có chân trên một tầng và không cắt ngang aperture.
- [ ] Đường không thành dải vàng đều; ngã rẽ/đầu cửa không phình tròn vô lý.
- [ ] Người chơi nhận ra đoạn lội khi tắt nhãn/debug; nước sâu vẫn đọc là vật cản.
- [ ] Tầng, collision, đường và vật liệu xuất từ cùng dữ liệu tác giả; không dùng một mask ảnh riêng đoán vùng đi.
- [ ] Duyệt mỹ thuật riêng với kiểm thử gameplay. Đạt test không đồng nghĩa ảnh đã đẹp hoặc giống mẫu.

**Bàn giao lượt này:** kết quả nghiên cứu, chẩn đoán source và đặc tả triển khai. Các module mới và cảnh thử chưa được vẽ/dựng; không ghi là đã nâng cấp xong map.
