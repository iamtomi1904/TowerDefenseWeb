# Nâng cấp hình ảnh bảy class

Áp dụng trực tiếp trong `public/game.js` và `public/effects.js`.

- Hỏa, Thủy, Lôi, Chiến binh (cả hai hero), Cung thủ, Kiếm khách và Hộ vệ có bảng màu trang phục riêng. Lớp xử lý pixel chạy một lần lúc tải, giữ alpha, kích thước sheet, số frame và điểm đặt chân. Đây là nâng cấp bảng màu trên sprite hiện có, không phải bộ sprite mới vẽ lại.
- 21 kỹ năng có hình học riêng: lửa, băng, thủy triều, sét, vệt chém, đá, mưa tên và khiên. Thay vòng pulse/art tĩnh cũ cho các kỹ năng này.
- Đạn nguyên tố, đòn thường cận chiến và điểm sáng nhận diện được cập nhật. Hiệu ứng ngọc và quái giữ đường render riêng.
- Không sửa thông số sát thương, thời gian hồi, phạm vi tác dụng hoặc mô phỏng chiến đấu.
- `/class-gallery.html`: xem trước/sau, 5 động tác, lật hướng và thử Q/E/R. Trang này liên kết từ xưởng hiệu ứng.

## Kiểm tra

`node --test class-visuals.test.mjs actor-animation.test.mjs enemy-vfx.test.mjs gem-vfx.test.mjs`: 14/14 đạt.

Kiểm tra cú pháp các module mới và module tích hợp đạt. Bộ `npm test` toàn dự án vẫn có lỗi ở các ca mô phỏng/skill/bản đồ ngoài phần giao diện; không sửa các lỗi đó trong thay đổi này. Công cụ trình duyệt bị timeout, nên chưa xác nhận trực quan bản render WebGL cuối cùng.

## Bản sửa hiệu ứng pixel và thi triển

- Thay renderer hình học bằng stamp pixel vẽ tay, contour bậc thang, palette 5 sắc độ, lửa/băng/khiên/mảnh đá/tên và sét có lõi sáng. Không dùng arc/ellipse/triangle trong renderer kỹ năng mới.
- Sét liên hoàn cũng dùng pixel beam, bỏ art overlay cũ.
- Server phát castCount/castAnim cho bảy class khi kỹ năng thi triển thành công. Client phát lại đầy đủ chuỗi sprite tấn công/niệm phép sẵn có; giữ động tác đến hết, ngắt khi chết/choáng. Đây là kết nối hoạt ảnh sẵn có, chưa phải bộ động tác Q/E/R mới vẽ riêng.
- Trang gallery phát động tác cùng nút kỹ năng. Bản gốc đứng bên trái, bản nâng cấp thi triển bên phải.
- Kiểm tra lại: 10/10 ca trong class-visuals và actor-animation đạt; có ca thi triển giữa đòn thường, giữ pose và bị ngắt bởi choáng.
- design/class-pixel-refresh/preview.png được render trực tiếp từ cùng hàm vẽ để kiểm tra tạo hình bảy nhóm kỹ năng.

## Đồng bộ phần xem kỹ năng với trận thật

Trang class-gallery không còn tự tạo event AOE, tự đặt radius=100 hoặc hẹn giờ nổ riêng. scripts/build-skill-previews.mjs chạy simulation.tick thật cho 24 tổ hợp hero/QER ở bậc 1, không ngọc; ghi event cùng snapshot nhân vật, mục tiêu và buff vào public/skill-previews.json. Trang phát lại các snapshot theo bước 50ms, dùng chung actorAction, unitVFX, playEmpowered, renderEvent và updateVFX với game; nhân vật cao 57px như chiến trường. Mục tiêu tập đứng yên, nhiều HP; đây là điều kiện tập có ghi rõ trên giao diện.

Các nút thuộc bảy class ở effect-lab chuyển tới đúng bản phát lại; không dùng các sự kiện giả cũ. Chạy npm run preview:build sau khi thay logic kỹ năng. test/skill-preview.test.mjs so sánh sự kiện/timing/geometry bản lưu với engine hiện tại để phát hiện bản xem thử cũ. 14 kiểm thử liên quan đạt.

## Du Pháp: ba đợt sóng, vùng thủy dưỡng, Băng Vực có điểm đặt

- Q Hàn Triều: bán kính 210 (+20%), ba sóng cách nhau 0,45s, mỗi sóng lan trong 0,6s và gây 65% Công. Theo dõi số lần trúng riêng cho từng mục tiêu/từng lần cast; đủ ba lần mới hất tung 0,6s. Sát thương và hitbox cập nhật theo bán kính sóng thật.
- E (kỹ năng giữa, được người dùng gọi là W) Thủy Dưỡng: bán kính 520, tồn tại cố định 10s, hồi 2% HP tối đa mỗi giây ở bậc 1. Bậc tiếp theo tăng 0,5 điểm phần trăm/giây. Đồng minh trong vùng giảm 15% sát thương; rời vùng hết bảo hộ ngay, nhiều vùng không cộng dồn giảm sát thương. Bao gồm hero và lính, không hồi nhà hoặc hồi sinh người chết.
- R Băng Vực đặt tại con trỏ, giới hạn 350; không có dữ liệu chuột thì đặt theo hướng nhìn ở tầm tối đa. Gửi thêm aimDistance đã giới hạn từ client đến server, không đặt tự động dưới chân.
- Các event tide-wave/tide-field/tide-lift dùng pixel nước, bọt sóng, ấn hồi phục và biểu tượng bảo hộ. Băng Vực giữ bão tuyết và trụ băng.
- Hiệu ứng vũ khí sáng có lõi pixel, viền màu và hạt sáng khi castCount thay đổi, áp dụng chung cho mọi class trong unitVFX; hết động tác, chết hoặc choáng sẽ dừng ánh sáng.
- Đã tái tạo 24 bản xem thử bằng engine hiện tại. 19 kiểm thử liên quan đạt (gồm sát thương quái giảm thật khi ở vùng).

## Cung thủ, Kiếm Chủ, Cuồng Chiến và Chiến Binh

- Độc Tiễn là buff 8s cho tên thường và Liên Tiễn: độc 25% Công/giây trong 4s, chậm 20%. Có aura độc và tên độc riêng. R Cung thủ giương cung 0,65s trước khi tạo vùng mưa tên; chết/choáng ngắt chuẩn bị.
- Kiếm Chủ có sprite katana và song katana mới trong assets/blademaster/katana-forms.png, 36 frame với hai bộ idle/walk/attack. Tạo bằng built-in image_gen, prompt lưu cùng thư mục. E là đổi dạng cố định, dùng lại để quay về, không reset hồi Q/R.
- Nhất kiếm +20% Công, Q trọng trảm 240%, R hiện đại katana rồi giáng 380%. Song kiếm +8% Công, +30% tốc đánh, mỗi đòn thứ ba thêm 65% Công; Q lướt chém chéo hai nhát 100%; R sáu nhát 55% rồi kết liễu chéo 140%. Hotbar và xem thử phản ánh dạng đang dùng.
- Cuồng Chiến warrior-2 đổi classId ravager, có Huyết Liên Trảm hai nhát, Huyết Nộ cường hóa và Cuồng Sát Phong sáu nhịp, dùng effect huyết khí riêng.
- Chiến Binh warrior-1 Q vận rìu và quét pixel nặng. R nhảy trong tầm 180, đáp sau 0,65s gây địa chấn 320% Công / bán kính 200, hất tung 0,55s, sau khi rơi mới choáng 1,2s. Hình nhảy cập nhật theo trạng thái thật, không chỉ là effect.
- Hoạt ảnh nhiều nhát được phát lại theo từng nhịp sát thương. Chuẩn bị/chuỗi chém khóa di chuyển và đánh thường; chết/choáng hủy các nhát chưa xảy ra. Khống chế sau địa chấn đã đáp vẫn hoàn tất nếu chủ nhân sau đó bị ngắt.
- 27 bản xem thử từ simulation.tick, gồm cả Q/E/R của song kiếm. Trang cho chọn bắt đầu bằng song kiếm. Độc Tiễn xem thử có bắn tên sau khi cường hóa.
- 26 kiểm thử liên quan đạt: buff độc thật, sát thương độc từ tên, chuẩn bị R và ngắt bởi choáng, nội tại hai dạng, Q/R khác nhau, nhảy/đáp/hất tung/choáng theo thứ tự, hai/sáu nhát Cuồng Chiến, pixel geometry và hồi quy Du Pháp.

## Nhát chém đặc trưng và bão tên độc

- Thay cung chém đậm dùng chung bằng atlas pixel 6 kiểu x 6 giai đoạn: katana, song kiếm giao nhau, huyết trảm ba vệt rách, rìu bổ đất đá, đại kiếm giáng, song kiếm kết liễu. Asset ở public/assets/combat/signature-slashes.png, prompt cùng thư mục, tạo bằng built-in image_gen.
- Đòn thường và Q/R dùng kiểu chém, kích thước và chiều vung tương ứng. Đường kiếm/khói/lõi sáng/đất đá tách nhau; khi dùng atlas chỉ vẽ thêm chi tiết va chạm, bỏ toàn bộ cung đậm phủ lên. Effect có cleanup khi hết thời gian, đổi map hoặc chạm giới hạn.
- Các nhát chém Phong Kiếm, Thánh Kỵ, Hắc Kỵ và Sát thủ bỏ lớp cung hình học dày, dùng đường cắt pixel thuôn nhọn, tia gió, dấu thánh, vết nứt hồn hoặc hai dao giao nhau. Giữ các atlas đặc trưng đã có.
- R Cung thủ vẫn chuẩn bị 0,65s nhưng sau đó là bão tên rơi liên tục trong 4s. Sát thương 16% Công / 0,2s, 20 nhịp. Render dùng một emitter liên tục, không lặp các xung nổ.
- Nếu E Độc Tiễn bật khi bắt đầu R, chụp trạng thái tẩm độc cho toàn đợt bão: tên xanh có vệt độc; từng nhịp R gây độc/làm chậm thật. E hết giữa lúc chuẩn bị hoặc trong bão không làm tên đã tẩm mất độc.
- Bản xem thử có lựa chọn Cung thủ E rồi R, tổng 28 bản phát lại từ engine. Kiểm tra hình atlas trực tiếp và test đăng ký 36 frame, bounds, vòng đời, silhouette khác nhau, timing 20 nhịp, độc thật và E hết trong lúc chuẩn bị. Kiểm tra trong trình duyệt bị công cụ dừng do chưa hỗ trợ URL policy trên Cốc Cốc Windows.

## Cuồng Chiến: vẽ lại toàn bộ nhân vật

- Sprite mới public/assets/ravager/hero-v2.png, tạo bằng built-in image_gen, giữ alpha, bản gốc không xóa. Prompt nằm trong public/assets/ravager/PROMPT.md.
- Nhân vật tóc bạc, thân hình lực lưỡng, giáp sắt tối, áo choàng đỏ rách, trọng kiếm răng cưa; 36 frame cho đứng, chạy, chém, gầm cường hóa, bị thương và chết.
- public/ravager-art.js đăng ký frame bằng kích thước thực 1246 x 1263, làm tròn cạnh từng ô. Điểm đặt chân (.5,.98), body ratio .8 ô. Animation một lần giữ khung cuối, không lặp gục ngã.
- Hook vào playMartialActor để dùng cùng trong trận và gallery, trước đường empowered cũ. Khi bật Huyết Nộ dùng thân hình mới, động tác gầm riêng và vũ khí/hào quang chung, không chuyển về warrior-2-fury cũ.
- Trang chọn hero, actor-lab và class-gallery đều dùng hình mới; trang so sánh vẫn cho thấy hình cũ bên trái. Thêm nhận diện động tác bị thương cho ravager trong trận.
- 17 kiểm thử liên quan đạt, gồm 36 frame, 6 hàng động tác, alpha, điểm đặt chân, giữ khung chết, gầm cường hóa và hồi quy kỹ năng.

## Sửa ánh sáng trọng kiếm Cuồng Chiến

Ánh sáng cũ chỉ lóe ngắn và dùng điểm cố định ở cạnh tay. public/ravager-art.js nay tạo texture phát sáng từ các pixel lưỡi kiếm theo 36 khung hình của sprite mới; lớp sáng đi cùng frame, vị trí, scale, hướng lật và gốc đặt chân. Huyết Nộ giữ sáng suốt buff; kỹ năng Q/R cũng phát sáng trong động tác. Tắt ánh sáng khi hết buff/chết, cleanup theo sprite. Bỏ đường sáng giả cạnh tay cho warrior-2. 21 kiểm thử liên quan đạt.

## Tám nhân vật vẽ lại, Quỷ Ảnh thân thiện và pháp sư nguyên tố

- public/assets/heroes-v2 chứa tám bộ sprite và toàn bộ prompt tạo/chỉnh bằng built-in image_gen. Dạ Tiễn là hắc tinh linh cầm cung; Quỷ Ảnh goblin song thích có gương mặt thân thiện hơn; Thiết Vệ trọng giáp/khiên tháp; Cung Thủ cung gỗ/giáp da xanh; Chiến Binh rìu hai tay lớn.
- Hỏa Sư có họa tiết lửa/viền đồng vàng/gấu áo cháy; Lôi Sư có đường sét bạc/giáp góc cạnh/pha lê điện; Du Pháp có hoa văn sóng nước/viền băng/khăn thêu tuyết. Các họa tiết có trên mọi frame, không chỉ khi thi triển.
- Mỗi hero 36 frame riêng cho 6 động tác. public/hero-refresh-art.js đăng ký từ kích thước thực; giữ gốc chân, lật hướng, thời gian đánh/thi triển, giữ khung chết. Hình mới ưu tiên trước đường empowered cũ.
- Trận, trang chọn hero, actor-lab và class-gallery dùng hình mới; phần so sánh vẫn có ảnh cũ bên trái. Gallery bổ sung Dạ Tiễn/Quỷ Ảnh và lựa chọn động tác thi triển. Có 34 bản xem kỹ năng từ simulation.tick, gồm cả tinh linh triệu hồi.
- Đã kiểm tra trực tiếp tám ảnh cuối; 42 kiểm thử liên quan đạt (sprite, animation, glow, mô phỏng kỹ năng và hiệu ứng).

## Đợt cập nhật Lôi Sư / Dạ Tiễn / Chiến Tướng / Phong Kiếm

- R Lôi Sư và R Dạ Tiễn có bán kính cơ bản 205. Vùng Nguyệt Thực có lớp nền đậm, trăng lơ lửng, sao và atlas mới được giữ theo shadowZones trong toàn thời gian vùng tồn tại.
- Hai sprite mới 36 frame: warrior-3.png theo tinh thần hoplite/Pantheon, trường thương, khiên tròn lớn, mũ che mặt Corinthian, tay và thân ít giáp; samurai.png áo nhẹ xanh ngọc/ngà, khăn/ribbon dài và hoa văn gió. Prompt cuối lưu cạnh ảnh.
- Q/R Thiết Vệ dùng row thi triển của sprite mới, Q nhịp 0,5s và R nhịp 0,9s.
- elemental-refresh.png là atlas image_gen 6x6: lốc gió, bão băng, sóng biển đầu bạc, nổ lửa, biển lửa, vùng nguyệt thực. Tích hợp trong các renderer hiện tại, cleanup khi hết sự kiện/đổi map. Lốc có thân phễu và mảnh lá, Q Du Pháp có đầu sóng cuộn và bọt trắng, R Du Pháp có trụ băng/tuyết xoáy.
- Hào quang Thánh Kỵ đổi bảng màu viền sang xanh lam ngọc và lõi sáng ngà để tăng tương phản.
- Bản xem thử đã tái tạo từ engine; hoạt ảnh và palette mới được dùng trong trận và gallery.

## Thánh Kỵ Sĩ và Hắc Kỵ Sĩ đồng bộ

- Bốn atlas mới trong public/assets/knights-v2: dạng bộ hành và dạng cưỡi của mỗi class, mỗi atlas 36 frame/sáu động tác.
- Thánh Kỵ Sĩ giáp bạc/ngà, viền vàng, áo choàng xanh trắng và đại kiếm hai tay bản rộng. Hắc Kỵ Sĩ giáp sắt đen, áo tím và điểm nhấn linh hồn xanh.
- knight-refresh-art.js chuyển đúng atlas theo holyMounted/fallenMounted; giữ động tác chết, phát lại thi triển theo castCount và giữ thời gian đánh.
- Trận, avatar, cửa sổ chiến đấu, class-gallery và trang xem riêng hai kỵ sĩ cùng dùng hình mới. Gallery có nút chọn dạng cưỡi.
- Prompt nguồn lưu trong public/assets/knights-v2/prompts.md. Kiểm thử frame/alpha/chuyển dạng/thi triển/chết và khởi tạo gallery đạt; bốn ảnh được máy chủ local phục vụ HTTP 200.

## Sprite effect v3, nhịp vận phép và tỉ lệ chiều cao

- Bản phác hình học đã bị loại khỏi phần hiển thị chính. Ba atlas image_gen mới: elemental-v3.png (6x6), martial-v3.png (6x4), mage-orbits-v3.png (6x3). painted-skill-art.js phát từng frame cho sóng biển tròn, bão tuyết ít băng, vùng lửa thấp, sét đơn/vùng/liên hoàn, địa chấn, Q gió, E giáo hình nón và hào quang cơ thể cự nhân. Prompt lưu tại public/assets/combat/painted-v3-prompts.md.
- R Dạ Tiễn/Hỏa Sư chuẩn bị 0,6s; Lôi Sư 0,7s. Hành động trì hoãn do server quản lý, hủy khi chết/choáng/đổi stage. Giữ động tác trước khi hiệu ứng xuất hiện. Replay 46 kỹ năng dựng lại từ mô phỏng, có đủ thời gian vùng Nguyệt Thực.
- Địa chấn có pha rơi tăng tốc, chớp va chạm, đất đá bật lên và rung camera; sát thương/hất tung/choáng vẫn theo thời điểm tiếp đất.
- Thiên mã trắng có giáp bạc-vàng và cánh lông vũ đập theo chu kỳ; chiến mã Hắc Kỵ có cánh xương động. Cả hai kỵ sĩ dùng đại kiếm, kiếm Thánh có chắn hình cánh và phù văn mặt trời. Prompt sửa lưu trong public/assets/knights-v2/revision-prompts.md.
- hero-stature.js thống nhất chiều cao: goblin 0,78; cung thủ/pháp sư 1; kiếm khách 1,06–1,08; trọng giáp/chiến binh 1,20–1,24. Dạng cưỡi 2,5 lần cơ sở, khoảng gấp đôi dạng đi bộ. Body ratio và điểm đặt chân được đo riêng để phần trống/vũ khí không làm thu nhỏ thân. height-lineup.html xem chung tỉ lệ; trận và gallery dùng cùng hàm.
- 117 kiểm thử liên quan đạt; kiểm tra cú pháp client đạt. Server nạp lại tại localhost:3011, HTTP 200 cho ba atlas effect, bốn atlas kỵ sĩ, gallery và trang chiều cao. Chưa kiểm chứng tương tác trong trình duyệt; xác minh ảnh nguồn và các frame/lifecycle bằng kiểm thử.

## Sửa nền vuông mờ của effect

- Atlas martial-v3 có alpha nền thấp còn sót (mép hàng hào quang: trung vị 16/255, p95 42/255), tạo ô chữ nhật khi phóng lớn/chồng frame. effect-alpha.js lọc nền lúc upload, loại alpha nền <=76 cho atlas này, giữ lõi nét đậm và làm trong suốt mép từng cell để ngăn lẫn frame kế bên.
- Painted effect, hào quang cơ thể, nguyên tố bay và atlas elemental cũ đều dùng texture đã lọc, tạo một lần và tái sử dụng. Không sửa file nguồn hay thay đổi kỹ năng.
- 16 kiểm thử liên quan đạt: nền mờ về alpha 0, nét đặc giữ alpha255, mép mỗi frame trong suốt, không sửa nguồn, cache texture, sprite và gallery khởi tạo đúng. Các module mới được phục vụ HTTP200.

## Tiết chế Du Pháp, Lôi Sư, Hỏa Sư và căn địa chấn

- restrained-elements-v1.png (image_gen 6x5) có vành nước mỏng, cụm gió tuyết nhỏ, bông tuyết, sét không mây và đốm lửa thấp. Prompt cạnh ảnh. Q giữ vòng 360 độ và phạm vi mô phỏng, mask chỉ giữ dải crest mỏng trên sprite vẽ.
- R Du Pháp dùng 8 cụm gió và 51 hạt tuyết có quỹ đạo/vận tốc/pha riêng, cập nhật vị trí mỗi frame; không còn một ảnh bão lớn đổi frame nhấp nháy. Lôi R dùng 4 luồng sét độc lập, E một luồng; loại mây. E Hỏa giảm diện tích lửa và độ sáng, không khói.
- Địa chấn đặt origin tại tâm tiếp xúc mặt đất của hình crater (.5,.72) thay vì tâm ô ảnh. Chiến Binh bỏ interpolation vị trí khi nhảy/tiếp đất để chân không trễ sau effect; động tác rìu theo tiến trình nhảy: giơ lên, giữ trên đầu, bổ xuống, giữ rìu tại đất khi hồi động tác. Bỏ vòng charge lưu lại tại điểm xuất phát.
- 35 kiểm thử liên quan đạt, gồm chuyển động tuyết giữa hai thời điểm sát nhau, cleanup mọi hạt, dải sóng mỏng, điểm neo crater và thứ tự động tác rìu. HTTP200 cho asset và module mới. Chỉ thay client, không đổi sát thương/tầm kỹ năng.

## Pixel hành động: ảnh thành phần nguyên vẹn, dung nham và hai vùng bão

- Theo lựa chọn người dùng: pixel rõ, gọn, có lực. action-skill-art.js thay toàn bộ cách cắt atlas ở Q Du Pháp, R Du Pháp, E Hỏa Sư, E/R Lôi Sư bằng PNG thành phần riêng trong assets/combat/action-v1. Không gọi texture.add/frame rect cho các ảnh này; bỏ các mask và crop cũ của sóng/sét. Nguồn image_gen và prompt đã lưu trong PROMPTS.md và REGION-PROMPTS.md.
- Q là vòng nước mỏng đủ 360 độ, bọt và wake dịch chuyển theo bán kính mô phỏng. R Du Pháp có vùng sương giá cố định, 10 dải tuyết quét, 96 bông tuyết, 32 vệt tuyết nhanh và 4 điểm băng thấp chuyển động độc lập; không còn 6-frame ảnh bão nhấp nháy.
- R Lôi Sư có vùng tích điện phủ cả bán kính 205, bốn luồng sét đánh theo các nhịp và vị trí độc lập, tám điểm phóng điện sát đất. Vùng duy trì liên tục; mây được tiết chế.
- E Hỏa Sư đổi thành vùng dung nham liền mạch với đá basalt, khe nóng đỏ-cam, ít lửa thấp và tàn lửa. Mô tả cập nhật; phạm vi/sát thương/thời gian gameplay giữ nguyên.
- Kích thước nội dung và điểm neo đo riêng trong action-fx-layout.js; giữ toàn ảnh, xử lý alpha/mép trong suốt một lần. Texture runtime giới hạn 512px bằng nearest-neighbor để giữ pixel và giảm bộ nhớ; không thay file nguồn.
- Đã quan sát trực tiếp Q/R Du Pháp, E Hỏa Sư và R Lôi Sư trong IAB trên class-gallery. Ảnh hiển thị đầy đủ, lava phủ vùng liên tục, bão tuyết/sét có nền vùng và lớp chuyển động. Console cảnh báo/lỗi trống ở kiểm tra cuối R Lôi Sư. 37 kiểm thử liên quan đạt; sau chỉnh thời lượng vùng băng và tối ưu upload, 20 kiểm thử renderer/alpha/gallery đạt.

## Gió và mây nhỏ cho R Lôi Sư

- Thêm storm-wisp.png do image_gen vẽ nguyên ảnh, prompt trong STORM-WISP-PROMPT.md. R có ba cụm mây nhỏ trôi chậm ở cao độ khác nhau, ba dải gió chuyển động quanh vùng, alpha tối đa 0,41 và nằm sau sét. E không thêm mây.
- Dùng cùng lớp lọc alpha và giới hạn texture512px; không cắt atlas. Kiểm thử chuyển động riêng của sáu lớp thời tiết, mức trong suốt và cleanup đạt; 10 kiểm thử renderer/alpha/gallery đạt.

## Vòng phép R, lốc băng và thiên thạch phá đất

- R Hỏa/Lôi/Du có sprite vòng phép nguyên ảnh, tô màu theo nguyên tố. Hỏa có vòng vận phép và vòng tại điểm rơi; Lôi/Du giữ vòng trong vùng R.
- R Du thêm ba lốc băng, tăng tuyết từ96 lên144 hạt và vệt tuyết nhanh32 lên48. Q tăng lớp wake từ0,25 lên0,42 và giảm khoảng cách hai mép nước từ8 xuống5 để dày thêm nhẹ.
- Khi meteor-impact xảy ra mới tạo lớp crater/đá vỡ từ sprite martial, origin (.5,.72) tại tâm va chạm; vòng phép và crater đều cleanup khi hết hoặc clear/evict.
- R Lôi giữ ba cụm mây nhỏ và ba dải gió sau các luồng sét; chỉ R được thêm thời tiết.
- 22 kiểm thử renderer/alpha/gallery đạt. Đã xem R Du có vòng/lốc/tuyết và thiên thạch chạm đất có đá vỡ trực tiếp trong IAB, console không lỗi/cảnh báo. Prompt mới: STORM-WISP-PROMPT.md, ULTIMATE-PROMPTS.md.

## Hiệu ứng theo cấp cho các class vật lý

- class-progression-art.js bổ sung cho11 class còn lại, dùng6 ảnh nguyên vẹn image_gen trong assets/combat/class-wisps: kiếm khí, mũi tên linh quang, khí lực, phù văn kỵ sĩ, phù văn Thiết Vệ và bóng dao. Thánh/Hắc và các nhánh có bảng màu khác nhau.
- Cùng mốc1/6/11/16 với pháp sư; số lượng2/3/4/5, độ sáng và kích thước tăng dần. Chỉ ngoại hình. Có lớp sau/trước thân, căn theo thân người cưỡi khi lên ngựa; cleanup khi chết, đổi class, hạ cấp xem thử hoặc hủy sprite.
- Gallery có Cấp ngoại hình; hình mới ở phần so sánh và replay nhận cùng level ngoại hình. Bỏ chọn Hiệu ứng nhận diện dọn các lớp xem thử. Không đổi rank hoặc chỉ số simulation.
- 22 kiểm thử renderer/gallery/class progression đạt. Prompt nguồn lưu cùng thư mục class-wisps/PROMPTS.md.
