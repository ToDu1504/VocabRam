# 🐏 VocabRAM — Kế hoạch dự án chi tiết

> **"Nạp từ vựng, nhớ như RAM."** — *Load words into your memory.*

Web học từ vựng tiếng Anh theo danh sách **Oxford 5000**, chia theo **Level → Unit (22 từ) → Thẻ học**, kèm gợi ý, phát âm và 3 chế độ ôn tập.

---

## Mục lục

1. [Mục tiêu & phạm vi](#1-mục-tiêu--phạm-vi)
2. [Tech stack](#2-tech-stack)
3. [Kiến trúc tổng quan](#3-kiến-trúc-tổng-quan)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Dữ liệu từ vựng](#5-dữ-liệu-từ-vựng)
6. [Database (Prisma schema)](#6-database-prisma-schema)
7. [Chức năng chi tiết & logic](#7-chức-năng-chi-tiết--logic)
8. [API](#8-api)
9. [Frontend](#9-frontend)
10. [Chế độ 1 user (chưa có đăng nhập)](#10-chế-độ-1-user-chưa-có-đăng-nhập)
11. [Lộ trình thực hiện](#11-lộ-trình-thực-hiện)
12. [Quyết định còn mở](#12-quyết-định-còn-mở)
13. [Hướng phát triển sau này](#13-hướng-phát-triển-sau-này)
14. [Quy ước code](#14-quy-ước-code)

---

## 1. Mục tiêu & phạm vi

### Mục tiêu
- Tự học từ vựng tiếng Anh hiệu quả, từ A1 → C1.
- Kiến trúc sạch, sau này dễ mở rộng thành nhiều user và học DevOps trên chính dự án này.

### Phạm vi giai đoạn đầu (MVP)
- ✅ Chạy **local**, **1 user** (chính mình), chưa đăng ký/đăng nhập.
- ✅ Học theo Level → Unit → Thẻ.
- ✅ Hint + phát âm.
- ✅ 3 chế độ ôn.
- ❌ Chưa Docker, chưa deploy, chưa CI/CD.
- ❌ Chưa admin, chưa thống kê nâng cao.

---

## 2. Tech stack

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend | **Next.js (App Router) + TypeScript** | Chỉ làm giao diện, **không** truy cập DB |
| Styling | **Tailwind CSS** | Theme tối như thiết kế mẫu |
| Backend | **Node.js + Express + TypeScript** | Toàn bộ logic & API |
| ORM | **Prisma** | Type an toàn, migration rõ ràng |
| Database | **MySQL 8** | |
| Validate | **Zod** | Kiểm tra body/params của request |
| Phát âm | **Web Speech API** + audio từ Free Dictionary API (sau) | |
| Ảnh | OpenMoji (MVP) → Gemini sinh ảnh (sau) | Phong cách cartoon, mọi lứa tuổi |

**Quy tắc vàng:** Next.js **không** dùng API Routes / Server Actions để truy cập DB. Mọi dữ liệu đi qua Express `/api/v1/...`.

---

## 3. Kiến trúc tổng quan

```
┌────────────────────┐   HTTP/JSON    ┌──────────────────────┐   Prisma   ┌─────────┐
│  Next.js frontend  │ ─────────────▶ │  Express backend     │ ─────────▶ │  MySQL  │
│  localhost:3000    │ ◀───────────── │  localhost:4000      │ ◀───────── │  :3306  │
└────────────────────┘                └──────────────────────┘            └─────────┘
                                                │
                                                └── /static/images, /static/audio
```

Backend chia lớp:

```
request → routes → middlewares (currentUser, validate) → controllers → services → repositories → Prisma → MySQL
```

- **routes**: khai báo URL.
- **controllers**: nhận request, gọi service, trả response. Không chứa logic.
- **services**: logic nghiệp vụ (chia unit, xáo trộn, chấm điểm, phiên ôn). Không biết gì về Express.
- **repositories**: truy vấn DB.
- **Stateless**: không lưu trạng thái trong RAM server, mọi thứ nằm trong DB.

---

## 4. Cấu trúc thư mục

```
vocabram/
├── README.md
├── docs/
│   └── VocabRAM-PLAN.md          ← file này
├── data/
│   ├── raw/                      ← 2 file PDF Oxford gốc
│   │   ├── American_Oxford_3000.pdf
│   │   └── American_Oxford_5000.pdf
│   ├── parsed/
│   │   └── wordlist.json         ← từ + loại từ + level (đã tách, bỏ trùng)
│   └── content/
│       ├── A1.json               ← dữ liệu đầy đủ theo level
│       ├── A2.json
│       └── ...
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── scripts/
│   │   ├── parse-oxford.ts       ← PDF → wordlist.json
│   │   ├── build-units.ts        ← chia unit 22 từ
│   │   ├── fetch-audio.ts        ← (sau) lấy IPA/audio từ Free Dictionary API
│   │   └── generate-images.ts    ← (sau) sinh ảnh bằng Gemini
│   ├── static/
│   │   ├── images/
│   │   └── audio/
│   └── src/
│       ├── server.ts             ← khởi động server
│       ├── app.ts                ← tạo app Express, gắn middleware, routes
│       ├── config/
│       │   └── env.ts            ← đọc & validate .env
│       ├── lib/
│       │   └── prisma.ts         ← 1 instance PrismaClient
│       ├── middlewares/
│       │   ├── currentUser.ts
│       │   ├── validate.ts
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── level.routes.ts
│       │   ├── unit.routes.ts
│       │   ├── word.routes.ts
│       │   └── review.routes.ts
│       ├── controllers/
│       ├── services/
│       │   ├── level.service.ts
│       │   ├── unit.service.ts
│       │   ├── progress.service.ts
│       │   └── review.service.ts
│       ├── repositories/
│       ├── schemas/              ← Zod schemas
│       └── utils/
│           └── shuffle.ts        ← Fisher–Yates
└── frontend/
    ├── package.json
    ├── next.config.ts
    ├── .env.local.example
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx                      ← Dashboard
        │   ├── levels/[code]/page.tsx        ← Danh sách unit
        │   ├── learn/[unitId]/page.tsx       ← Học unit
        │   ├── review/page.tsx               ← Chọn chế độ ôn
        │   └── review/[sessionId]/page.tsx   ← Phiên ôn
        ├── components/
        │   ├── UnitList.tsx
        │   ├── UnitItem.tsx
        │   ├── WordCard.tsx
        │   ├── MaskedSentence.tsx
        │   ├── AnswerInput.tsx
        │   ├── HintButton.tsx
        │   ├── AudioButton.tsx
        │   ├── ProgressBar.tsx
        │   └── ResultScreen.tsx
        ├── hooks/
        │   ├── useLearningQueue.ts
        │   ├── useHint.ts
        │   └── useSpeech.ts
        ├── lib/
        │   ├── api.ts                ← fetch wrapper gọi backend
        │   └── answer.ts             ← chuẩn hóa & so sánh đáp án
        └── types/
            └── index.ts
```

---

## 5. Dữ liệu từ vựng

### 5.1 Nguồn
| File | Nội dung | Level |
|---|---|---|
| `American_Oxford_3000.pdf` | 3000 từ cốt lõi | A1, A2, B1, B2 |
| `American_Oxford_5000.pdf` | **Chỉ ~2000 từ bổ sung** (không lặp 3000 từ kia) | B2, C1 |

→ **Phải gộp cả 2 file.** File PDF chỉ có: *từ, loại từ, level*. Không có nghĩa, ví dụ, phát âm.

### 5.2 Quy tắc tách (parse)
1. Một dòng có nhiều loại từ / level → tách thành nhiều dòng:
   - `complex adj. B1, n.B2` → `complex | adj | B1` và `complex | noun | B2`
   - `before prep. A1, conj., adv.A2` → `before | prep | A1`, `before | conj | A2`, `before | adv | A2`
     (loại từ không ghi level riêng thì lấy level đứng ngay sau nó)
2. Xử lý chữ dính: `adv.A2` → `adv.` + `A2`.
3. Từ có dạng `a, an` → lấy `a` làm từ chính, lưu `an` làm biến thể.
4. Khóa duy nhất: **(word, pos)**. Ví dụ `driving | noun | A2` và `driving | adj | C1` là 2 thẻ khác nhau.
5. Bỏ header/footer PDF (`© Oxford University Press`, số trang, tiêu đề).

Chuẩn hóa loại từ:

| PDF | Lưu |
|---|---|
| `n.` | `noun` |
| `v.` | `verb` |
| `adj.` | `adjective` |
| `adv.` | `adverb` |
| `prep.` | `preposition` |
| `conj.` | `conjunction` |
| `pron.` | `pronoun` |
| `det.` | `determiner` |
| `exclam.` | `exclamation` |
| `modal v.` | `modal verb` |
| `indefinite article`, `definite article` | `article` |
| `number` | `number` |

### 5.3 Chia unit
- Mỗi level: **xáo trộn 1 lần** (Fisher–Yates, có seed cố định để chạy lại ra cùng kết quả) → chia 22 từ / unit.
- `số unit = ceil(số từ trong level / 22)`. Unit cuối có thể < 22 từ.
- **Không** xếp theo alphabet (Unit 1 sẽ toàn chữ "a…").
- Ước lượng (đếm lại bằng script khi có dữ liệu thật):

| Level | ~Số từ | ~Số unit |
|---|---|---|
| A1 | ~1060 | ~49 |
| A2 | ~990 | ~45 |
| B1 | ~905 | ~42 |
| B2 | ~1570 | ~72 |
| C1 | ~1390 | ~64 |

### 5.4 Định dạng JSON nội dung (`data/content/<LEVEL>.json`)

```json
{
  "level": "B1",
  "units": [
    {
      "number": 1,
      "words": [
        {
          "position": 1,
          "word": "opportunity",
          "pos": "noun",
          "variants": [],
          "meaning_vi": "cơ hội",
          "definition_en": "A chance or a good time to do something.",
          "definition_vi": "Một dịp hoặc thời điểm thuận lợi để làm điều gì đó.",
          "example_en": "This is a great {{opportunity}} for you.",
          "example_vi": "Đây là một cơ hội tuyệt vời cho bạn.",
          "ipa": "/ˌɑːpərˈtuːnəti/",
          "audio_url": null,
          "image_url": null,
          "image_prompt": "A cheerful kid opening a bright glowing door that leads to a sunny world"
        }
      ]
    }
  ]
}
```

**Quan trọng — đánh dấu từ trong câu ví dụ bằng `{{...}}`:**
- Từ trong câu có thể bị chia: *opportunit**ies***, *we**nt***, *bigg**er***.
- `{{...}}` cho biết **chính xác đoạn nào cần che**.
- Ví dụ: `She {{went}} to school.` → hiển thị `She **** to school.`
- Đáp án chấp nhận: từ gốc (`go`) **hoặc** dạng trong câu (`went`).

### 5.5 Nội dung do ai làm
| Trường | Cách tạo |
|---|---|
| word, pos, level | Script parse PDF |
| meaning_vi, definition_en/vi, example_en/vi, image_prompt | Claude viết (tự viết, **không** copy Oxford), làm theo đợt |
| ipa | Claude viết → đối chiếu lại bằng Free Dictionary API |
| audio_url | Script `fetch-audio.ts` (sau) |
| image_url | MVP: OpenMoji cho từ cụ thể, ảnh mặc định 🐏 cho từ còn lại → sau: Gemini |

**Đợt đầu:** 2 unit đầu của A1 (44 từ) để test chất lượng & cách học.

### 5.6 Ảnh
- Phong cách chung cho mọi ảnh (prompt Gemini):
  > *flat cartoon illustration, bright friendly colors, simple shapes, suitable for all ages, no text, no violence, plain light background*
- Từ trừu tượng → vẽ **tình huống** (opportunity = bạn nhỏ mở cánh cửa sáng).
- Từ nhạy cảm (weapon, kill, drug, blood…) → minh họa nhẹ nhàng (drug = hộp thuốc ở hiệu thuốc).
- Định dạng: `.webp`, 256×256, tên file `<wordId>.webp`.
- ❌ Không lấy ảnh tùy tiện trên mạng (bản quyền + phong cách không đồng đều).

### 5.7 Bản quyền
- Danh sách Oxford thuộc bản quyền **Oxford University Press**. Dùng cho học cá nhân / đồ án.
- Chỉ dùng **từ + loại từ + level**. Định nghĩa, ví dụ tự viết.
- Nếu public/thương mại hóa → xem lại điều khoản.

---

## 6. Database (Prisma schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int                @id @default(autoincrement())
  name         String
  email        String?            @unique   // dùng khi có đăng nhập
  passwordHash String?                      // dùng khi có đăng nhập
  createdAt    DateTime           @default(now())
  progress     UserWordProgress[]
  sessions     ReviewSession[]
}

model Level {
  id    Int    @id @default(autoincrement())
  code  String @unique      // A1, A2, B1, B2, C1
  name  String              // "Beginner", ...
  order Int
  units Unit[]
}

model Unit {
  id      Int    @id @default(autoincrement())
  levelId Int
  number  Int
  level   Level  @relation(fields: [levelId], references: [id])
  words   Word[]

  @@unique([levelId, number])
}

model Word {
  id           Int     @id @default(autoincrement())
  unitId       Int
  position     Int
  word         String
  pos          String
  sense        String  @default("")  // "money"/"river", "homonym 1", hoặc rỗng
  variants     Json?                // ["an"]
  meaningVi    String
  definitionEn String  @db.Text
  definitionVi String  @db.Text
  exampleEn    String  @db.Text     // có {{...}}
  exampleVi    String  @db.Text
  ipa          String?
  audioUrl     String?
  imageUrl     String?
  imagePrompt  String? @db.Text
  unit         Unit    @relation(fields: [unitId], references: [id])
  progress     UserWordProgress[]

  @@unique([word, pos, sense])
  @@unique([unitId, position])
}

enum ProgressStatus {
  NEW
  LEARNING
  LEARNED
}

model UserWordProgress {
  userId         Int
  wordId         Int
  status         ProgressStatus @default(NEW)
  correctCount   Int            @default(0)
  wrongCount     Int            @default(0)
  hintCount      Int            @default(0)
  lastReviewedAt DateTime?
  user           User           @relation(fields: [userId], references: [id])
  word           Word           @relation(fields: [wordId], references: [id])

  @@id([userId, wordId])
  @@index([userId, status])
}

enum ReviewMode {
  UNIT    // ôn unit vừa học
  ALL     // ôn xáo trộn tất cả từ đã học
  LEVEL   // ôn hoàn thành level, không lặp
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
}

model ReviewSession {
  id           Int           @id @default(autoincrement())
  userId       Int
  mode         ReviewMode
  levelId      Int?
  unitId       Int?
  wordOrder    Json          // [12, 5, 88, ...] id từ đã xáo trộn
  currentIndex Int           @default(0)
  wrongWordIds Json          // [5, 88]
  phase        String        @default("MAIN") // MAIN | RETRY_WRONG (chỉ dùng cho LEVEL)
  status       SessionStatus @default(IN_PROGRESS)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  user         User          @relation(fields: [userId], references: [id])

  @@index([userId, mode, status])
}
```

**Ghi chú:**
- Tiến độ unit (`x/22 cards`) **không lưu riêng** → đếm `UserWordProgress` có `status = LEARNED` trong unit.
- Level của từ lấy qua `word → unit → level`.

---

## 7. Chức năng chi tiết & logic

### 7.1 Danh sách Level (Dashboard)
- Hiển thị 5 level, mỗi level: `đã thuộc / tổng`, thanh tiến độ.
- Nút "Tiếp tục học" → unit chưa xong đầu tiên.
- Nếu có phiên ôn `IN_PROGRESS` → hiện "Tiếp tục ôn B1 (340/906)".

### 7.2 Danh sách Unit (theo thiết kế ảnh 1)
| Trạng thái | Giao diện |
|---|---|
| Hoàn thành (`learned == total`) | Viền xanh lá, chữ xanh, ✓ |
| Đang chọn | Nền xanh dương |
| Chưa học / đang học | Nền tối, hiện `x/22 cards` |

### 7.3 Thẻ học (theo thiết kế ảnh 2)
Hiển thị theo thứ tự:
1. Ảnh minh họa
2. **Nghĩa tiếng Việt** + nhãn loại từ (Noun, Verb…)
3. English Definition
4. Definition (tiếng Việt)
5. Example: câu tiếng Anh **đã che từ** (`***`, số sao = số ký tự của đoạn bị che) + câu tiếng Việt
6. Ô hint `*********` + nút **Hint**
7. Ô nhập "Enter English word..."
8. Nút **DON'T KNOW** và **CHECK ANSWER**
9. Icon ⚠️ báo lỗi dữ liệu (sau này)

**IPA và nút 🔊 chỉ hiện sau khi trả lời** (hiện sớm sẽ lộ đáp án).

### 7.4 Hàng đợi khi học unit (`useLearningQueue`)
```
queue = shuffle(22 từ của unit, bỏ các từ đã LEARNED nếu học tiếp)
while queue không rỗng:
    card = queue[0]
    nếu đúng:      queue.shift();           gửi { result: "correct" }   → LEARNED
    nếu Don't Know: hiện đáp án; queue.push(queue.shift()); gửi { result: "dont_know" } → LEARNING, wrongCount++
    nếu sai:       báo sai, cho thử lại (không đổi queue)
queue rỗng → ResultScreen (số câu đúng lần đầu, số lần sai, số hint)
```

### 7.5 Kiểm tra đáp án (`lib/answer.ts`)
```ts
normalize(s) = s.trim().toLowerCase().replace(/\s+/g, " ")
đúng nếu normalize(input) ∈ { normalize(word), normalize(dạng trong {{...}}), ...variants }
```

### 7.6 Hint (`useHint`)
- Mỗi lần bấm mở thêm 1 chữ cái từ trái sang: `o**********` → `op*********`.
- Khoảng trắng / dấu gạch nối luôn hiện, không tính là chữ.
- **Giới hạn mở chữ:** `maxReveal = Math.floor(letterCount / 2)` (từ 1–2 chữ: không mở chữ).
- **Hint cuối cùng (sau khi mở hết giới hạn):** phát âm từ 🔊, nút đổi icon thành loa.
- Sau đó khóa nút Hint → chỉ còn Check / Don't Know.
- Gửi `hintsUsed` lên server cùng kết quả.

### 7.7 Phát âm (`useSpeech`)
```ts
// Ưu tiên audio thật, không có thì dùng giọng máy
if (word.audioUrl) new Audio(word.audioUrl).play();
else {
  const u = new SpeechSynthesisUtterance(word.word);
  u.lang = "en-US";
  speechSynthesis.speak(u);
}
```
- Chỉ phát sau thao tác click (trình duyệt chặn autoplay).

### 7.8 Ba chế độ ôn

| Chế độ | Nguồn từ | Lặp lại | Kết thúc |
|---|---|---|---|
| **UNIT** — ôn unit vừa học | 22 từ của unit | Từ sai/Don't Know đưa xuống cuối | Đúng hết |
| **ALL** — ôn xáo trộn tất cả | Mọi từ `LEARNED` | Có | Mỗi lượt 20 câu (hoặc tự dừng) |
| **LEVEL** — ôn hoàn thành level | Toàn bộ từ trong level | **Không** | Hết danh sách **và** hết từ sai |

**ALL — chọn từ:**
1. Lấy từ `LEARNED`, sắp ưu tiên: `wrongCount` cao, `lastReviewedAt` cũ.
2. Lấy 40 từ đầu → xáo trộn → lấy 20.

**LEVEL — luồng:**
```
Bắt đầu:
  nếu có session LEVEL IN_PROGRESS cho level này → tiếp tục
  ngược lại → wordOrder = shuffle(tất cả id từ trong level), lưu DB

phase MAIN:
  hiện wordOrder[currentIndex]
  đúng → currentIndex++
  sai/Don't Know → thêm vào wrongWordIds, currentIndex++ (KHÔNG quay lại ngay)
  hết wordOrder → chuyển phase RETRY_WRONG

phase RETRY_WRONG:
  ôn wrongWordIds giống chế độ UNIT (sai thì xuống cuối)
  hết → status = COMPLETED → 🎉 Hoàn thành level
```
- Lưu `currentIndex` sau **mỗi** câu trả lời → thoát ra vào lại vẫn đúng chỗ.

### 7.9 Thuật toán xáo trộn (`utils/shuffle.ts`)
```ts
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```
❌ Không dùng `arr.sort(() => Math.random() - 0.5)` (xáo không đều).

---

## 8. API

Base URL: `http://localhost:4000/api/v1`

### Học
| Method | URL | Mô tả |
|---|---|---|
| GET | `/levels` | Danh sách level + `{ learned, total }` |
| GET | `/levels/:code/units` | Danh sách unit của level + `{ learned, total }` mỗi unit |
| GET | `/units/:id/words` | Toàn bộ từ trong unit + trạng thái của user |
| POST | `/words/:id/answer` | Ghi kết quả trả lời |

`POST /words/:id/answer` body:
```json
{ "result": "correct", "hintsUsed": 2 }
```
`result`: `"correct"` | `"dont_know"`

### Ôn tập
| Method | URL | Mô tả |
|---|---|---|
| GET | `/reviews/active` | Các phiên đang dở (để hiện "Tiếp tục") |
| POST | `/reviews` | Tạo phiên mới hoặc trả về phiên đang dở |
| GET | `/reviews/:id` | Thông tin phiên + từ hiện tại + tiến độ |
| POST | `/reviews/:id/answer` | Ghi kết quả, trả về từ tiếp theo |

`POST /reviews` body:
```json
{ "mode": "LEVEL", "levelCode": "B1" }
{ "mode": "UNIT", "unitId": 12 }
{ "mode": "ALL" }
```

### Thống kê (sau)
| Method | URL | Mô tả |
|---|---|---|
| GET | `/stats` | Tổng từ đã thuộc, từ hay sai nhất… |

### Định dạng lỗi chung
```json
{ "error": { "code": "NOT_FOUND", "message": "Unit not found" } }
```

---

## 9. Frontend

### Trang
| Route | Trang | Loại component |
|---|---|---|
| `/` | Dashboard: level, tiến độ, tiếp tục | Server + Client |
| `/levels/[code]` | Danh sách unit | Client |
| `/learn/[unitId]` | Học unit (thẻ học) | Client (`"use client"`) |
| `/review` | Chọn chế độ ôn | Client |
| `/review/[sessionId]` | Phiên ôn | Client |

### Giao diện
- Theme tối như ảnh mẫu: nền xanh than, thẻ bo góc, viền mảnh.
- Màu trạng thái: xanh lá = hoàn thành, xanh dương = đang chọn, đỏ = Don't Know, cam = Hint.
- Responsive: điện thoại → danh sách unit thành drawer/tab, thẻ học full màn hình.
- Phím tắt: `Enter` = Check, `Ctrl+H` = Hint, `Esc` = Don't Know.

### Biến môi trường
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 10. Chế độ 1 user (chưa có đăng nhập)

1. Seed 1 user: `{ id: 1, name: "Khanhvu" }`.
2. Middleware gán user cố định:
```ts
// src/middlewares/currentUser.ts
import { Request, Response, NextFunction } from "express";

export function currentUser(req: Request, _res: Response, next: NextFunction) {
  req.user = { id: 1 }; // TODO: thay bằng verify JWT khi có đăng nhập
  next();
}
```
3. Mọi service/repository nhận `userId` từ `req.user.id` — **không bao giờ** ghi cứng `1` ở nơi khác.

→ Khi thêm đăng nhập: **chỉ thay middleware này** + thêm `/auth/register`, `/auth/login`. Tiến độ cũ (user id 1) giữ nguyên.

---

## 11. Lộ trình thực hiện

> **📌 Tiến độ (cập nhật 2026-11-19)**
> - Dữ liệu: A1 (1077 từ/49 unit), A2 (992/45), B1 (903/41) **đã đủ nội dung** → `data/content/A1|A2|B1.json`. B2, C1 chưa làm.
> - Nguồn nội dung: `data/content/_<LEVEL>_*.tsv` (sửa ở đây rồi build lại, không sửa JSON tay).
> - Quy trình: `python scripts/unit_words.py <LV> <từ> <đến>` → viết TSV → `python scripts/check_content.py <LV>` → `python scripts/build_content.py <LV>`.
> - Cách làm B2/C1: Sonnet viết song song (6 unit/agent), Opus kiểm tra. Lỗi hay gặp: dùng nghĩa Anh-Anh thay vì Anh-Mỹ, chọn nhầm homonym, che `{{cell}}s` thay vì `{{cells}}`.
> - **Đã chốt (2026-11-19):** (a) unit cuối < 6 từ gộp vào unit trước (`MIN_LAST` trong `build_units.py`) → A2 U45 = 24 từ, B1 U41 = 23 từ. (b) `Word` có cột `sense` (= `note` trong TSV), khoá `@@unique([word, pos, sense])`.
> - **Backend (Giai đoạn 1) xong 2026-11-19:** `backend/` Express 5 + Prisma 6 + MySQL (`root` không mật khẩu, DB `vocabram`), seed A1–B1, 4 API học chạy được (`backend/api.http`).
> - **Giai đoạn 2–4 xong 2026-11-19:** `frontend/` Next.js 16 + Tailwind 4 (học unit, hint, phát âm, phím tắt, 3 chế độ ôn); backend thêm `/reviews`. Chế độ LEVEL hiện **không** bắt học hết level trước (§12 #2).
> - **Việc tiếp theo:** Giai đoạn 5 — nội dung B2/C1, `fetch-audio`, ảnh OpenMoji.

### Giai đoạn 0 — Dữ liệu mẫu
- [x] Tải 2 file PDF Oxford vào `data/raw/`
- [x] Parse → `data/parsed/wordlist.json` (`python scripts/parse_oxford.py`) — 5918 thẻ
- [x] Chia unit → `data/parsed/units.json` (`python scripts/build_units.py`) — A1 1077/49, A2 992/45, B1 903/41, B2 1550/71, C1 1396/64
- [x] Sinh nội dung 2 unit đầu A1 (44 từ) → `data/content/A1.json` (`python scripts/build_content.py A1`, nguồn `_A1_batch1.tsv`)

### Giai đoạn 1 — Backend cơ bản
- [x] Khởi tạo `backend/`: `npm init`, TypeScript, `tsx` (chạy dev) (ESLint + Prettier: chưa)
- [x] Express "Hello" chạy ở cổng 4000
- [x] `config/env.ts` đọc `.env` (validate bằng Zod)
- [x] Cài Prisma, viết `schema.prisma`, chạy migration đầu tiên
- [x] `seed.ts`: 5 level, user id 1, đọc `data/content/*.json` → units, words
- [x] Middleware: `currentUser`, `errorHandler`, `validate`
- [x] API: `GET /levels`, `GET /levels/:code/units`, `GET /units/:id/words`, `POST /words/:id/answer`
- [x] Test API bằng Postman / Thunder Client / file `.http`

### Giai đoạn 2 — Giao diện học
- [x] Khởi tạo `frontend/`: Next.js + TS + Tailwind
- [x] `lib/api.ts` + `types/`
- [x] Dashboard
- [x] Trang danh sách unit (giống ảnh 1)
- [x] `WordCard` + `MaskedSentence` + `AnswerInput` (giống ảnh 2)
- [x] `useLearningQueue` (đúng → bỏ ra, Don't Know → xuống cuối)
- [x] `ResultScreen` khi xong unit
- [x] Cập nhật ✓ xanh trên danh sách unit

### Giai đoạn 3 — Hint & phát âm
- [x] `useHint`: mở từng chữ, giới hạn `floor(n/2)`, hint cuối phát âm
- [x] `useSpeech`: audio thật → fallback Web Speech API
- [x] Hiện IPA + 🔊 sau khi trả lời
- [x] Phím tắt

### Giai đoạn 4 — 3 chế độ ôn
- [x] Bảng `ReviewSession` + `review.service.ts`
- [x] Chế độ UNIT
- [x] Chế độ ALL (ưu tiên từ hay sai / lâu chưa ôn)
- [x] Chế độ LEVEL (không lặp, lưu tiến độ, RETRY_WRONG cuối)
- [x] Hiện "Tiếp tục ôn" trên Dashboard

### Giai đoạn 5 — Dữ liệu đầy đủ & ảnh
- [ ] Sinh nội dung toàn bộ A1 → C1 (theo đợt) — ✅ A1, A2, B1 xong (2972 từ, kiểm tra bằng `scripts/check_content.py`); còn B2, C1
- [ ] `fetch-audio.ts`: IPA + audio từ Free Dictionary API, đối chiếu IPA
- [ ] Ảnh MVP: OpenMoji cho từ cụ thể + ảnh mặc định 🐏
- [ ] (Tùy chọn) `generate-images.ts`: Gemini, chạy tiếp được khi lỗi giữa chừng

### Giai đoạn 6 — Dùng thử & đánh giá
- [ ] Tự học 2–4 tuần
- [ ] Ghi lại: tốc độ thuộc, từ hay quên, chỗ khó dùng trên giao diện
- [ ] Điều chỉnh (giới hạn hint, số câu/lượt ôn, khóa unit…)

---

## 12. Quyết định còn mở

| # | Câu hỏi | Đề xuất tạm |
|---|---|---|
| 1 | Có khóa unit (phải xong Unit 4 mới mở Unit 5)? | Không khóa, chỉ gợi ý unit tiếp theo |
| 2 | Chế độ LEVEL có bắt học hết các unit trước? | Có — chỉ mở khi level đã học hết |
| 3 | Gõ sai có tính `wrongCount`? | Không, chỉ Don't Know mới tính |
| 4 | Giọng đọc US hay UK? | US (khớp file American Oxford), sau thêm tùy chọn |
| 5 | Số câu mỗi lượt ôn ALL | 20 |

---

## 13. Hướng phát triển sau này

**Nhiều người dùng**
- Đăng ký / đăng nhập: bcrypt + JWT (thay middleware `currentUser`).
- Trang cá nhân, thống kê, streak.

**Học tập**
- Lặp lại ngắt quãng (spaced repetition, ví dụ SM-2) cho chế độ ALL.
- Luyện nói: `SpeechRecognition` (Chrome).
- Trang admin duyệt / sửa dữ liệu, tạo lại ảnh lỗi; nút ⚠️ báo lỗi từ.

**DevOps** (khi app đã chạy ổn)
1. Docker hóa: `Dockerfile` cho frontend (`output: "standalone"`) & backend, `docker-compose.yml` (frontend + backend + mysql)
2. Deploy VPS + Nginx (reverse proxy `/api`, phục vụ ảnh/audio)
3. CI/CD với GitHub Actions
4. Load test bằng k6, theo dõi p95 / CPU / RAM
5. Redis cache dữ liệu từ vựng, chạy nhiều instance

**Mobile**
- React Native gọi thẳng API Express.

---

## 14. Quy ước code

- Claude viết code (app, data pipeline, nội dung); user review và chạy thử.
- TypeScript `strict: true` ở cả 2 phía.
- Đặt tên: file `kebab-case` hoặc `camelCase.ts` thống nhất; component `PascalCase.tsx`; DB dùng `camelCase` trong Prisma.
- Controller mỏng, logic nằm trong service.
- Không commit `.env` — chỉ commit `.env.example`.
- Git:
  - Nhánh `main` luôn chạy được; làm tính năng trên `feat/<tên>`.
  - Commit theo Conventional Commits: `feat: add hint button`, `fix: mask inflected word`, `chore: setup prisma`.
- Mỗi giai đoạn xong → cập nhật checklist trong file này.
