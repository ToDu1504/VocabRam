// Seeds levels, user 1, and units/words from data/content/<LEVEL>.json.
// Idempotent: upserts by natural keys, so re-running keeps learner progress.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CONTENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../data/content");

const LEVELS = [
  { code: "A1", name: "Beginner", order: 1 },
  { code: "A2", name: "Elementary", order: 2 },
  { code: "B1", name: "Intermediate", order: 3 },
  { code: "B2", name: "Upper Intermediate", order: 4 },
  { code: "C1", name: "Advanced", order: 5 },
];

interface ContentWord {
  position: number;
  word: string;
  pos: string;
  sense: string | null;
  homonym: number | null;
  variants: string[];
  meaning_vi: string;
  definition_en: string;
  definition_vi: string;
  example_en: string;
  example_vi: string;
  ipa: string | null;
  audio_url: string | null;
  image_url: string | null;
  image_prompt: string | null;
}
interface ContentFile {
  level: string;
  units: { number: number; words: ContentWord[] }[];
}

const senseOf = (w: ContentWord) => w.sense ?? (w.homonym ? `homonym ${w.homonym}` : "");

async function main() {
  await prisma.user.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "Khanhvu" } });

  for (const lv of LEVELS) {
    const level = await prisma.level.upsert({
      where: { code: lv.code },
      update: { name: lv.name, order: lv.order },
      create: lv,
    });

    const file = resolve(CONTENT_DIR, `${lv.code}.json`);
    if (!existsSync(file)) {
      console.log(`${lv.code}: no content file, skipped`);
      continue;
    }
    const content = JSON.parse(readFileSync(file, "utf-8")) as ContentFile;
    let count = 0;

    for (const u of content.units) {
      const unit = await prisma.unit.upsert({
        where: { levelId_number: { levelId: level.id, number: u.number } },
        update: {},
        create: { levelId: level.id, number: u.number },
      });
      // Free positions first so moving words between units can't hit the (unitId, position) unique key.
      await prisma.word.updateMany({ where: { unitId: unit.id }, data: { position: { increment: 10000 } } });

      for (const w of u.words) {
        const data = {
          unitId: unit.id,
          position: w.position,
          variants: w.variants,
          meaningVi: w.meaning_vi,
          definitionEn: w.definition_en,
          definitionVi: w.definition_vi,
          exampleEn: w.example_en,
          exampleVi: w.example_vi,
          ipa: w.ipa,
          audioUrl: w.audio_url,
          imageUrl: w.image_url,
          imagePrompt: w.image_prompt,
        };
        const key = { word: w.word, pos: w.pos, sense: senseOf(w) };
        await prisma.word.upsert({
          where: { word_pos_sense: key },
          update: data,
          create: { ...key, ...data },
        });
        count++;
      }
    }
    console.log(`${lv.code}: ${content.units.length} units, ${count} words`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
