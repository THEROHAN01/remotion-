// Generates voiceover audio with Cartesia for every variant whose props contain `voiceover`.
// Audio goes to public/voiceover/<slug>/<line>-<hash>.wav and the line's `audio`
// ({ src, seconds, hash }) is written back into the variant. Unchanged lines are skipped,
// so you only pay for lines you edit.
//
// Requires CARTESIA_API_KEY (in the environment or in .env at the repo root).
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_MODEL = "sonic-3";

const lineHash = (vo, line) =>
  createHash("sha1")
    .update(
      JSON.stringify({
        text: line.text,
        voiceId: vo.voiceId,
        model: vo.model ?? DEFAULT_MODEL,
        language: vo.language ?? "en",
        speed: vo.speed ?? 1,
        emotion: vo.emotion ?? null,
      }),
    )
    .digest("hex")
    .slice(0, 10);

// Duration of a PCM WAV from its header.
const wavSeconds = (buf) => {
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = buf.readUInt32LE(offset + 16);
    if (id === "data" && byteRate) return size / byteRate;
    offset += 8 + size + (size % 2);
  }
  throw new Error("Could not read WAV duration");
};

export const loadEnv = (root) => {
  const file = path.join(root, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
};

let client;
const getClient = async () => {
  if (client) return client;
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey || apiKey.startsWith("your-")) {
    throw new Error(
      "CARTESIA_API_KEY is not set. Add it to .env (see .env.example) to generate voiceover.",
    );
  }
  const { default: Cartesia } = await import("@cartesia/cartesia-js");
  client = new Cartesia({ apiKey });
  return client;
};

// Returns true if the variant's props changed (new audio generated).
export const ensureVoiceover = async (variant, root, log = console.log) => {
  const vo = variant.props?.voiceover;
  if (!vo) return false;
  let changed = false;
  const dir = path.join(root, "public", "voiceover", variant.slug);

  for (const [i, line] of vo.lines.entries()) {
    const hash = lineHash(vo, line);
    const src = `voiceover/${variant.slug}/${i + 1}-${hash}.wav`;
    const file = path.join(root, "public", src);
    if (line.audio?.hash === hash && existsSync(file)) continue;

    const cartesia = await getClient();
    log(`  voiceover ${variant.slug} #${i + 1}: "${line.text}"`);
    const response = await cartesia.tts.generate({
      model_id: vo.model ?? DEFAULT_MODEL,
      transcript: line.text,
      voice: vo.voiceId,
      language: vo.language ?? "en",
      output_format: {
        container: "wav",
        encoding: "pcm_s16le",
        sample_rate: 44100,
      },
      ...(vo.speed || vo.emotion
        ? {
            generation_config: {
              ...(vo.speed ? { speed: vo.speed } : {}),
              ...(vo.emotion ? { emotion: vo.emotion } : {}),
            },
          }
        : {}),
    });
    const buf = Buffer.from(await response.arrayBuffer());
    await mkdir(dir, { recursive: true });
    await writeFile(file, buf);
    line.audio = {
      src,
      seconds: Math.round(wavSeconds(buf) * 1000) / 1000,
      hash,
    };
    changed = true;
  }

  // Warn when a line runs into the next one.
  vo.lines.forEach((line, i) => {
    const next = vo.lines[i + 1];
    if (line.audio && next && line.at + line.audio.seconds > next.at) {
      log(
        `  ⚠ ${variant.slug} line ${i + 1} ends at ${(line.at + line.audio.seconds).toFixed(2)}s but line ${i + 2} starts at ${next.at}s; move it or shorten the text`,
      );
    }
  });
  return changed;
};

// Generates voiceover for all variants in the given data files and saves updated files.
// Returns the variants that failed ({ slug, message }); other variants are unaffected.
export const generateForFiles = async (files, root, only) => {
  const failures = [];
  for (const file of files) {
    const list = JSON.parse(await readFile(file, "utf8"));
    let changed = false;
    for (const variant of list) {
      if (only && !only.includes(variant.slug)) continue;
      try {
        if (await ensureVoiceover(variant, root)) changed = true;
      } catch (err) {
        failures.push({ slug: variant.slug, message: err.message });
      }
    }
    if (changed) await writeFile(file, JSON.stringify(list, null, 2) + "\n");
  }
  return failures;
};
