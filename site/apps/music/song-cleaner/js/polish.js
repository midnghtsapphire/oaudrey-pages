/**
 * Local polish presets, named our own way. Not BandLab names or settings.
 * Loudness uses an in-browser ITU-R BS.1770-style estimate, not ffmpeg loudnorm.
 */

function biquadProcess(input, b0, b1, b2, a1, a2) {
  const out = new Float32Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < input.length; i += 1) {
    const x = input[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    out[i] = y;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
  }
  return out;
}

function peaking(input, sr, f0, gainDb, q) {
  if (Math.abs(gainDb) < 1e-6) return input;
  const A = 10 ** (gainDb / 40);
  const w0 = 2 * Math.PI * (f0 / sr);
  const alpha = Math.sin(w0) / (2 * q);
  const cos = Math.cos(w0);
  const b0 = 1 + alpha * A;
  const b1 = -2 * cos;
  const b2 = 1 - alpha * A;
  const a0 = 1 + alpha / A;
  const a1 = -2 * cos;
  const a2 = 1 - alpha / A;
  return biquadProcess(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0);
}

function lowshelf(input, sr, f0, gainDb, q = 0.7) {
  if (Math.abs(gainDb) < 1e-6) return input;
  const A = 10 ** (gainDb / 40);
  const w0 = 2 * Math.PI * (f0 / sr);
  const S = q;
  const alpha = (Math.sin(w0) / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
  const cos = Math.cos(w0);
  const twoSqrtA = 2 * Math.sqrt(A) * alpha;
  const b0 = A * ((A + 1) - (A - 1) * cos + twoSqrtA);
  const b1 = 2 * A * ((A - 1) - (A + 1) * cos);
  const b2 = A * ((A + 1) - (A - 1) * cos - twoSqrtA);
  const a0 = (A + 1) + (A - 1) * cos + twoSqrtA;
  const a1 = -2 * ((A - 1) + (A + 1) * cos);
  const a2 = (A + 1) + (A - 1) * cos - twoSqrtA;
  return biquadProcess(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0);
}

function highshelf(input, sr, f0, gainDb, q = 0.7) {
  if (Math.abs(gainDb) < 1e-6) return input;
  const A = 10 ** (gainDb / 40);
  const w0 = 2 * Math.PI * (f0 / sr);
  const S = q;
  const alpha = (Math.sin(w0) / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
  const cos = Math.cos(w0);
  const twoSqrtA = 2 * Math.sqrt(A) * alpha;
  const b0 = A * ((A + 1) + (A - 1) * cos + twoSqrtA);
  const b1 = -2 * A * ((A - 1) + (A + 1) * cos);
  const b2 = A * ((A + 1) + (A - 1) * cos - twoSqrtA);
  const a0 = (A + 1) - (A - 1) * cos + twoSqrtA;
  const a1 = 2 * ((A - 1) - (A + 1) * cos);
  const a2 = (A + 1) - (A - 1) * cos - twoSqrtA;
  return biquadProcess(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0);
}

// BS.1770 K-weighting at arbitrary sample rates: highpass ~38 Hz + high shelf ~1500 Hz +4 dB.
function kWeight(input, sr) {
  const hp = highshelfPre(input, sr); // actually highpass first
  return shelf1500(hp, sr);
}

function highshelfPre(input, sr) {
  // 2nd-order highpass ~38 Hz (Butterworth)
  const f0 = 38.0;
  const w0 = 2 * Math.PI * (f0 / sr);
  const q = Math.SQRT1_2;
  const alpha = Math.sin(w0) / (2 * q);
  const cos = Math.cos(w0);
  const b0 = (1 + cos) / 2;
  const b1 = -(1 + cos);
  const b2 = (1 + cos) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  return biquadProcess(input, b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0);
}

function shelf1500(input, sr) {
  return highshelf(input, sr, 1500, 4.0, 0.7);
}

function meanSquare(channel) {
  let sum = 0;
  for (let i = 0; i < channel.length; i += 1) sum += channel[i] * channel[i];
  return sum / Math.max(1, channel.length);
}

export function measureLufs(audio) {
  const sr = audio.sampleRate;
  const weights = audio.channels.length === 1 ? [1] : audio.channels.map((_, i) => (i < 2 ? 1 : 1.41));
  const gated = audio.channels.map((ch) => kWeight(ch, sr));
  // Block 400 ms, 75% overlap; relative gate -10 LU, absolute -70 LUFS.
  const block = Math.max(1, Math.round(sr * 0.4));
  const hop = Math.max(1, Math.round(block * 0.25));
  const n = gated[0].length;
  if (n < block) {
    let z = 0;
    for (let c = 0; c < gated.length; c += 1) z += weights[c] * meanSquare(gated[c]);
    if (z <= 1e-12) return -70;
    return -0.691 + 10 * Math.log10(z);
  }
  const blocks = [];
  for (let start = 0; start + block <= n; start += hop) {
    let z = 0;
    for (let c = 0; c < gated.length; c += 1) {
      let sum = 0;
      const ch = gated[c];
      for (let i = 0; i < block; i += 1) sum += ch[start + i] * ch[start + i];
      z += weights[c] * (sum / block);
    }
    blocks.push(z);
  }
  const absThresh = 10 ** ((-70 + 0.691) / 10);
  const above = blocks.filter((z) => z > absThresh);
  if (!above.length) return -70;
  const meanAbs = above.reduce((a, b) => a + b, 0) / above.length;
  const relThresh = meanAbs * 10 ** (-10 / 10);
  const gatedBlocks = above.filter((z) => z > relThresh);
  const used = gatedBlocks.length ? gatedBlocks : above;
  const mean = used.reduce((a, b) => a + b, 0) / used.length;
  if (mean <= 1e-12) return -70;
  return -0.691 + 10 * Math.log10(mean);
}

function applyGain(audio, db) {
  const g = 10 ** (db / 20);
  return {
    sampleRate: audio.sampleRate,
    channels: audio.channels.map((ch) => {
      const out = new Float32Array(ch.length);
      for (let i = 0; i < ch.length; i += 1) out[i] = ch[i] * g;
      return out;
    }),
  };
}

function limiter(audio, limitAmp) {
  return {
    sampleRate: audio.sampleRate,
    channels: audio.channels.map((ch) => {
      const out = new Float32Array(ch.length);
      let env = 0;
      const attack = 0.01;
      const release = 0.001;
      for (let i = 0; i < ch.length; i += 1) {
        const a = Math.abs(ch[i]);
        env = a > env ? env + (a - env) * (1 - attack) : env + (a - env) * release;
        const g = env > limitAmp ? limitAmp / env : 1;
        out[i] = ch[i] * g;
      }
      return out;
    }),
  };
}

function compressor(audio, thresholdDb, ratio, attackMs, releaseMs, makeupDb) {
  const sr = audio.sampleRate;
  const thresh = 10 ** (thresholdDb / 20);
  const attack = 1 - Math.exp(-1 / Math.max(1, (sr * attackMs) / 1000));
  const release = 1 - Math.exp(-1 / Math.max(1, (sr * releaseMs) / 1000));
  const makeup = 10 ** (makeupDb / 20);
  return {
    sampleRate: sr,
    channels: audio.channels.map((ch) => {
      const out = new Float32Array(ch.length);
      let env = 0;
      for (let i = 0; i < ch.length; i += 1) {
        const a = Math.abs(ch[i]);
        env = a > env ? env + (a - env) * attack : env + (a - env) * release;
        let g = 1;
        if (env > thresh) {
          const overDb = 20 * Math.log10(env / thresh);
          const red = overDb - overDb / ratio;
          g = 10 ** (-red / 20);
        }
        out[i] = ch[i] * g * makeup;
      }
      return out;
    }),
  };
}

export const PRESETS = {
  full_lift: {
    id: "full_lift",
    name: "Full lift",
    group: "lift",
    blurb: "Louder and tighter, aimed at about -9 LUFS.",
    targetLufs: -9,
    thresholdDb: -16,
    ratio: 2.8,
    attackMs: 10,
    releaseMs: 80,
    makeupDb: 3,
    lowDb: 0.8,
    highDb: 1.6,
    truePeak: -1.0,
  },
  even_lift: {
    id: "even_lift",
    name: "Even lift",
    group: "lift",
    blurb: "A middle-loudness polish, aimed at about -12 LUFS.",
    targetLufs: -12,
    thresholdDb: -20,
    ratio: 2.0,
    attackMs: 15,
    releaseMs: 120,
    makeupDb: 2,
    lowDb: 0.4,
    highDb: 0.8,
    truePeak: -1.2,
  },
  soft_lift: {
    id: "soft_lift",
    name: "Soft lift",
    group: "lift",
    blurb: "A gentler lift, aimed at about -16 LUFS.",
    targetLufs: -16,
    thresholdDb: -24,
    ratio: 1.5,
    attackMs: 20,
    releaseMs: 180,
    makeupDb: 1,
    lowDb: 0.2,
    highDb: 0.3,
    truePeak: -1.5,
  },
  voice_forward: {
    id: "voice_forward",
    name: "Voice forward",
    group: "balance",
    blurb: "Brings the vocal range (about 1–5 kHz) forward and settles the sides a little.",
    midHz: 2500,
    midGainDb: 2.8,
    midQ: 0.65,
    sideDb: -1.6,
  },
  band_forward: {
    id: "band_forward",
    name: "Band forward",
    group: "balance",
    blurb: "Gives the rest of the mix a little more width and eases the vocal range back.",
    midHz: 2500,
    midGainDb: -1.8,
    midQ: 0.65,
    sideDb: 1.5,
  },
};

export function listPresets() {
  return Object.values(PRESETS).map((p) => ({
    id: p.id,
    name: p.name,
    group: p.group,
    blurb: p.blurb,
    target_lufs: p.targetLufs ?? null,
  }));
}

export function getPreset(id) {
  if (!id) return null;
  const key = String(id).trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases = {
    full: "full_lift",
    medium: "even_lift",
    med: "even_lift",
    even: "even_lift",
    soft: "soft_lift",
    voice: "voice_forward",
    vocal: "voice_forward",
    music: "band_forward",
    band: "band_forward",
    music_forward: "band_forward",
  };
  const resolved = aliases[key] || key;
  const preset = PRESETS[resolved];
  if (!preset) throw new Error(`unknown preset ${id}`);
  return preset;
}

function mapChannels(audio, fn) {
  return { sampleRate: audio.sampleRate, channels: audio.channels.map((ch) => fn(ch, audio.sampleRate)) };
}

function applyBalance(audio, preset) {
  const sr = audio.sampleRate;
  if (audio.channels.length === 1) {
    return mapChannels(audio, (ch) => peaking(ch, sr, preset.midHz, preset.midGainDb, preset.midQ));
  }
  const left = audio.channels[0];
  const right = audio.channels[1];
  const n = left.length;
  const mid = new Float32Array(n);
  const side = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    mid[i] = 0.5 * (left[i] + right[i]);
    side[i] = 0.5 * (left[i] - right[i]);
  }
  const midEq = peaking(mid, sr, preset.midHz, preset.midGainDb, preset.midQ);
  const sideG = 10 ** (preset.sideDb / 20);
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  let peak = 0;
  for (let i = 0; i < n; i += 1) {
    const s = side[i] * sideG;
    outL[i] = midEq[i] + s;
    outR[i] = midEq[i] - s;
    peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
  }
  if (peak > 1) {
    const g = 0.99 / peak;
    for (let i = 0; i < n; i += 1) {
      outL[i] *= g;
      outR[i] *= g;
    }
  }
  const rest = audio.channels.slice(2).map((ch) => new Float32Array(ch));
  return { sampleRate: sr, channels: [outL, outR, ...rest] };
}

function applyLift(audio, preset) {
  let work = compressor(audio, preset.thresholdDb, preset.ratio, preset.attackMs, preset.releaseMs, preset.makeupDb);
  work = mapChannels(work, (ch, sr) => highshelf(lowshelf(ch, sr, 100, preset.lowDb), sr, 9000, preset.highDb));
  const before = measureLufs(work);
  const gain = preset.targetLufs - before;
  work = applyGain(work, gain);
  const limit = 10 ** (preset.truePeak / 20);
  work = limiter(work, limit);
  let after = measureLufs(work);
  if (Math.abs(after - preset.targetLufs) > 0.5) {
    work = limiter(applyGain(work, preset.targetLufs - after), limit);
    after = measureLufs(work);
  }
  return [work, after, before];
}

export function applyPolish(audio, liftId, balanceId) {
  const lift = liftId ? getPreset(liftId) : null;
  const balance = balanceId ? getPreset(balanceId) : null;
  if (lift && lift.group !== "lift") throw new Error(`${lift.name} is a balance preset, not a loudness lift`);
  if (balance && balance.group !== "balance") throw new Error(`${balance.name} is a loudness lift, not a balance preset`);
  const info = {
    lift: lift ? lift.id : null,
    lift_name: lift ? lift.name : null,
    balance: balance ? balance.id : null,
    balance_name: balance ? balance.name : null,
    target_lufs: lift ? lift.targetLufs : null,
    lufs_before: null,
    lufs_after: null,
    accurate_split: false,
    split_used: balance ? "mid-side" : "none",
    note: "",
  };
  if (!lift && !balance) return [audio, info];
  info.lufs_before = measureLufs(audio);
  let work = audio;
  if (balance) work = applyBalance(work, balance);
  if (lift) {
    const [out, after] = applyLift(work, lift);
    work = out;
    info.lufs_after = after;
  } else {
    info.lufs_after = measureLufs(work);
  }
  info.summary = describePolish(info);
  return [work, info];
}

export function describePolish(info) {
  const parts = [];
  if (info.lift_name) {
    const target = info.target_lufs != null ? `, target ${info.target_lufs.toFixed(0)} LUFS` : "";
    const measured = info.lufs_after != null ? `, measured ${info.lufs_after.toFixed(1)} LUFS` : "";
    parts.push(`${info.lift_name}${target}${measured}`);
  }
  if (info.balance_name) {
    const how = info.split_used && info.split_used !== "none" ? ` using ${info.split_used}` : "";
    parts.push(`${info.balance_name}${how}`);
  }
  if (info.note) parts.push(info.note);
  return parts.join("; ") || "no polish";
}
