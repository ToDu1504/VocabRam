# VocabRAM

> Nạp từ vựng, nhớ như RAM.

Web học từ vựng tiếng Anh theo danh sách Oxford 3000/5000: Level (A1–C1) → Unit (22 từ) → thẻ học.

Kế hoạch chi tiết: [VocabRAM-PLAN.md](VocabRAM-PLAN.md).

## Backend

```
cd backend
npm install
cp .env.example .env   # sửa DATABASE_URL
npx prisma migrate dev
npm run db:seed
npm run dev            # http://localhost:4000/api/v1
```

## Data pipeline (Python + pymupdf)

Xem `scripts/` và CLAUDE.md.
