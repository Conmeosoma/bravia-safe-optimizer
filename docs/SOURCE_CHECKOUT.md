# Lấy lại mã nguồn và các tùy chỉnh TV

Repo chính lưu dashboard cùng hai submodule được ghim ở commit cụ thể. Các tùy chỉnh launcher và SmartTube được lưu dưới dạng patch để có thể review và build lại, không cần quyền ghi vào repo SmartTube upstream.

## Clone đầy đủ

```powershell
git clone --recurse-submodules https://github.com/Conmeosoma/bravia-safe-optimizer.git
cd bravia-safe-optimizer
```

Với bản clone đã có, dùng `git submodule update --init --recursive` khi các submodule không có thay đổi cục bộ chưa lưu. Không dùng tùy chọn force để ghi đè công việc đang làm.

## Áp dụng tùy chỉnh trên checkout mới

Kiểm tra working tree và commit gốc trước khi áp dụng:

```powershell
git -C cleanyourtv status --short
git -C cleanyourtv rev-parse HEAD
git -C smarttube status --short
git -C smarttube rev-parse HEAD
```

Hai working tree phải sạch. Commit tương ứng phải là:

- CleanYourTV: `cc4c7c596c089c4a16f39480fef75c3349469bf9`.
- SmartTube: `5c63804758bb4e58c777a77789a3e45c8d022e75`.

```powershell
git -C cleanyourtv apply --check ../docs/cleanyourtv-bravia.patch
git -C cleanyourtv apply ../docs/cleanyourtv-bravia.patch
git -C smarttube apply --check ../docs/smarttube-bravia-ui.patch
git -C smarttube apply ../docs/smarttube-bravia-ui.patch
```

Các patch chứa cấu hình dock VTVgo/YouTube/Netflix và giao diện SmartTube BRAVIA. Sau khi áp dụng, Git sẽ báo submodule có thay đổi cục bộ; đó là trạng thái dự kiến. Không áp dụng patch lần nữa lên bản đã chỉnh.

Nếu `apply --check` thất bại, dừng và kiểm tra phiên bản/thay đổi cục bộ. Không ép áp dụng hoặc reset dữ liệu đang làm.

## Build và dữ liệu cục bộ

Thiết lập Node.js 24, sau đó chạy `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` cho dashboard. Xem `LAUNCHER_BUILD_REPORT.md` và `SMARTTUBE_TV_UI.md` để biết công cụ và tác vụ build Android.

APK, cache SDK/JDK, khóa ký, bản sao lưu, báo cáo chẩn đoán và log không đưa lên Git. Các patch không chứa định danh TV hoặc ảnh cá nhân. Clone/apply/build không cài ứng dụng hay thay đổi TV; mọi thao tác ghi TV vẫn tuân thủ AGENTS.md.
