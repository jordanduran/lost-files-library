import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Original synthetic fixtures, with no samples or third-party recordings.
// 16 seconds of quiet mono PCM per track, suitable for browser playback tests.
const directory = new URL("../public/audio/demo/", import.meta.url);
await mkdir(directory, { recursive: true });
const rate = 22050;
const seconds = 16;
const tempos = [142, 142, 98, 84, 160, 120, 96, 138];
for (let track = 0; track < tempos.length; track++) {
  const samples = rate * seconds;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples * 2, 40);
  let random = track + 1;
  const step = 60 / tempos[track];
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const beatTime = t % step;
    const beatIndex = Math.floor(t / step);
    const frequency =
      110 * 2 ** ((track + [0, 3, 7, 5][Math.floor(beatIndex / 2) % 4]) / 12);
    const bass =
      Math.sin(2 * Math.PI * frequency * t) * Math.exp(-beatTime * 8) * 0.15;
    const kick =
      Math.sin(
        2 * Math.PI * (48 * beatTime + 5 * (1 - Math.exp(-beatTime * 30))),
      ) *
      Math.exp(-beatTime * 24) *
      0.24;
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    const hat =
      (random / 2147483648 - 1) * Math.exp(-(t % (step / 2)) * 100) * 0.045;
    const melody =
      Math.sin(2 * Math.PI * frequency * 4 * t) *
      Math.exp(-beatTime * 12) *
      0.05;
    const fade = Math.min(1, t / 0.03, (seconds - t) / 0.25);
    wav.writeInt16LE(
      Math.round(
        Math.max(-1, Math.min(1, (bass + kick + hat + melody) * fade)) * 32767,
      ),
      44 + i * 2,
    );
  }
  await writeFile(new URL(`beat-${track + 1}.wav`, directory), wav);
}
console.log(
  `Generated ${tempos.length} synthetic previews in ${fileURLToPath(directory)}`,
);
