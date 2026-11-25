# Asset v2 — cây thông và hai nhân vật

Bộ bitmap được tạo bằng **công cụ image_gen tích hợp**, dựa trên khung hình
`video-review/world-06.png` từ video tham chiếu của người dùng. Không dùng CLI/API
fallback. Toàn bộ prompt được lưu trong [prompts.json](prompts.json).

Giữ mẫu trùm mũ ban đầu; thêm mẫu người tóc nâu, mặt rõ, áo kem/xanh ngọc và khăn
vàng. Mỗi mẫu gồm 48 khung ở ba hướng: 12 đi (khung 0 làm idle), 12 chạy riêng,
12 vung rìu, 12 trúng đòn. Hướng trái phản chiếu hướng phải.

| Source được giữ nguyên | Công dụng |
|---|---|
| `pine-source.png` | Một cây thông nền trong suốt, tán nhiều lớp và rễ |
| `hooded-source.png` | Sheet 4 cột × 9 hàng của nhân vật trùm mũ |
| `human-source.png` | Sheet 4 cột × 9 hàng của nhân vật người mới |
| `hooded-run-source.png` | Chu kỳ chạy 4 cột × 3 hàng của mẫu trùm mũ |
| `human-run-source.png` | Chu kỳ chạy 4 cột × 3 hàng của mẫu người |

## Tạo asset dùng trong game

Chạy từ gốc `TowerDefenseWeb`:

```powershell
node scripts/build-openworld-art.mjs
npx tsc -p tsconfig.openworld.json --noEmit
node --test tests/openworld-art.test.mjs
npm run openworld:build
```

Script phát hiện dải ảnh alpha theo hàng/cột, kiểm tra đúng số pose, chuẩn hóa
nearest-neighbor và bảng màu 32 màu. Không giả định ảnh ImageGen có lưới pixel
chia đều hoàn hảo. Cố định điểm chân **(32,54)** trong mỗi ô **64×64** để giữ nguyên
vị trí khi đổi hoạt ảnh; chừa chỗ cho đầu rìu vươn thấp hơn giày. Giữ nguyên raw
source để có thể đăng ký lại nếu chỉnh pivot/kích thước.

Output trong `public/openworld-art/v2/`: cây 64×96; sheet chính 256×576; sheet chạy
256×192; PNG normal map cùng kích thước, và `manifest.json` chứa vị trí đăng ký.
Normal map là dữ liệu pháp tuyến mặt cong được tạo có kiểm soát từ vùng cơ thể/tán,
không phải texture do tác giả video cung cấp. Dùng `NoColorSpace`, nearest và cùng
UV với albedo; không đổi sRGB/gamma của dữ liệu normal.

## Xem và tích hợp

- Trang `/openworld-art/` xem hai nhân vật song song: đứng/đi/chạy/vung rìu/trúng đòn,
  trước/phải/sau/trái và normal map. Đây là xem thử animation, không tự thêm HP/damage.
- Trang `/openworld.html` có dropdown **Nhân vật** để đổi giữa hai mẫu. Lựa chọn lưu
  riêng ở `openworld-avatar-v2`; vị trí, seed và thay đổi thế giới được giữ nguyên.
- `sprite-assets.ts` tải atlas trước khi dựng thế giới, tạo frame canvases và clone
  texture object theo mỗi player. Đổi nhân vật giải phóng texture cũ, không hủy thư viện.
- `ExplorerCharacter.playHitAnimation()` là hook trình bày cho combat sau này.
  Chạy dùng chu kỳ riêng, không chỉ tăng tốc sheet đi. Stats và quyền chủng tộc/nghề
  MMORPG không bị thay đổi bởi lựa chọn hình ảnh này.
- Bộ hình code cũ vẫn là fallback khi tải PNG thất bại; game báo lỗi bằng toast.

Kiểm thử kiểm tra alpha/padding, pose không rỗng, không cắt rìu/chân, điểm chân,
normal unit vectors và chu kỳ chạy khác sheet đi. Cần xem lại trực tiếp trong game
để đánh giá sắc độ dưới ánh sáng ngày/đêm và silhouette ở kích thước chơi thật.

Đã xác minh 25/11/2026: build/TypeScript và 16 kiểm thử openworld đạt. Trình duyệt
đã tải cây PNG vào cảnh, đổi từ mẫu trùm mũ sang mẫu người, di chuyển/vung rìu,
tải lại vẫn giữ mẫu người và vị trí `(8.1,8.1)`. Trang review chạy được run, axe
hướng phải và hit hướng trước; console hai trang không có error được ghi nhận.
