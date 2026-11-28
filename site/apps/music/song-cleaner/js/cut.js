/** Cut regions and join them with an equal-power crossfade. Never edits in place. */

export function equalPowerFades(n) {
  if (n <= 0) return [new Float32Array(0), new Float32Array(0)];
  if (n === 1) return [new Float32Array([0]), new Float32Array([1])];
  const fadeOut = new Float32Array(n);
  const fadeIn = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = (i / (n - 1)) * (Math.PI / 2);
    fadeOut[i] = Math.cos(t);
    fadeIn[i] = Math.sin(t);
  }
  return [fadeOut, fadeIn];
}

function mergeCuts(spots, duration) {
  const cuts = spots
    .filter((s) => s.action !== "keep" && s.end > s.start)
    .map((s) => [Math.max(0, s.start), Math.min(duration, s.end)])
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of cuts) {
    if (!merged.length || start > merged[merged.length - 1][1]) merged.push([start, end]);
    else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
  }
  return merged;
}

function copySlice(src, from, to) {
  const start = Math.max(0, Math.min(from, src.length));
  const end = Math.max(start, Math.min(to, src.length));
  return src.subarray(start, end);
}

export function applyCuts(audio, spots, crossfadeMs = 10) {
  const { sampleRate, channels } = audio;
  const n = channels[0].length;
  const nCh = channels.length;
  const duration = n / sampleRate;
  const fadeN = Math.max(1, Math.round(sampleRate * (crossfadeMs / 1000)));
  const merged = mergeCuts(spots, duration);
  if (!merged.length) {
    return { sampleRate, channels: channels.map((ch) => new Float32Array(ch)) };
  }

  const pieces = Array.from({ length: nCh }, () => []);
  let cursor = 0;

  const pushRange = (from, to) => {
    for (let c = 0; c < nCh; c += 1) pieces[c].push(copySlice(channels[c], from, to));
  };

  const crossfadeJoin = (rightFrom, rightTo) => {
    const rightLen = rightTo - rightFrom;
    for (let c = 0; c < nCh; c += 1) {
      const left = pieces[c][pieces[c].length - 1];
      const right = copySlice(channels[c], rightFrom, rightTo);
      const nFade = Math.min(fadeN, left.length, right.length);
      if (nFade <= 0) {
        pieces[c].push(right);
        continue;
      }
      const [fadeOut, fadeIn] = equalPowerFades(nFade);
      const overlap = new Float32Array(nFade);
      for (let i = 0; i < nFade; i += 1) {
        overlap[i] = left[left.length - nFade + i] * fadeOut[i] + right[i] * fadeIn[i];
      }
      pieces[c][pieces[c].length - 1] = left.subarray(0, left.length - nFade);
      pieces[c].push(overlap);
      pieces[c].push(right.subarray(nFade));
      void rightLen;
    }
  };

  merged.forEach(([start, end], idx) => {
    const startI = Math.min(Math.max(0, Math.round(start * sampleRate)), n);
    const endI = Math.min(Math.max(startI, Math.round(end * sampleRate)), n);
    if (idx === 0) {
      pushRange(cursor, startI);
      cursor = endI;
      return;
    }
    crossfadeJoin(cursor, startI);
    cursor = endI;
  });
  crossfadeJoin(cursor, n);

  const out = [];
  for (let c = 0; c < nCh; c += 1) {
    const parts = pieces[c].filter((p) => p.length);
    let total = 0;
    for (const p of parts) total += p.length;
    const chan = new Float32Array(total);
    let off = 0;
    for (const p of parts) {
      chan.set(p, off);
      off += p.length;
    }
    out.push(chan);
  }
  return { sampleRate, channels: out };
}

export function sliceSeconds(audio, start, end) {
  const a = Math.max(0, Math.round(start * audio.sampleRate));
  const b = Math.min(audio.channels[0].length, Math.round(end * audio.sampleRate));
  return {
    sampleRate: audio.sampleRate,
    channels: audio.channels.map((ch) => ch.slice(a, Math.max(a, b))),
  };
}
