# VocabRAM

> Nạp từ vựng, nhớ như RAM.

Web học từ vựng tiếng Anh theo danh sách Oxford 3000/5000 (American): Level A1–C1 → Unit 22 từ → thẻ học, có hint, phát âm và 3 chế độ ôn (unit, tổng hợp, hoàn thành level).

## Yêu cầu

- Node.js 20+
- MySQL 8 đang chạy

## Chạy

```bash
# 1. Backend — API ở http://localhost:4000/api/v1
cd backend
npm install
cp .env.example .env          # sửa DATABASE_URL cho MySQL của bạn
npx prisma migrate dev        # tạo database + bảng
npm run db:seed               # nạp thẻ từ data/content/*.json (xem bên dưới)
npm run dev

# 2. Frontend — http://localhost:3000 (terminal khác)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

**Dữ liệu từ vựng không có trong repo.** Đặt các file `A1.json` … `C1.json` vào `data/content/` (cùng cấp với `backend/`) trước khi seed; level nào thiếu file sẽ được bỏ qua.

`npm run db:seed` chạy lại được bất cứ lúc nào: nội dung được cập nhật, tiến độ học giữ nguyên.

## Phím tắt khi học

| Phím | Tác dụng |
|---|---|
| Enter | Kiểm tra / sang thẻ tiếp |
| Esc | Don't know |
| Ctrl+H | Hint |

## Cấu trúc

- `backend/` — Express 5 + TypeScript + Prisma (MySQL)
- `frontend/` — Next.js 16 + Tailwind CSS 4
- `data/content/` — nội dung từ vựng theo level (JSON, không đưa lên git)

Danh sách từ thuộc bản quyền Oxford University Press; định nghĩa và ví dụ được viết riêng. Chỉ dùng cho học cá nhân.
