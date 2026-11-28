/**
 * Shift pitch in a short region and leave the rest of the song unchanged.
 * Uses a length-preserving phase vocoder in plain JS (no wasm). Snap uses a
 * local YIN tracker, not librosa.pyin.
 */
import { fft, ifft, hann, nextPow2 } from "./fft.js";
import { toMono } from "./wav.js";
import { formatTime } from "./times.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function hzToMidi(hz) {
  return 69 + 12 * Math.log2(hz / 440);
}

export function midiToNote(midi) {
  const rounded = Math.round(midi);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${name}${octave}`;
}

export function describePitch(fix) {
  const amount = fix.appliedSemitones || 0;
  const direction = amount > 0 ? "up" : amount < 0 ? "down" : "unchanged";
  const bits = [`${formatTime(fix.start)}–${formatTime(fix.end)}`];
  if (Math.abs(amount) >= 0.001) bits.push(`shifted ${direction} ${Math.abs(amount).toFixed(2)} semitones`);
  else if (fix.action === "keep") bits.push("kept, not shifted");
  else bits.push("no shift applied");
  if (fix.detectedNote) {
    if (fix.snap && fix.targetNote) bits.push(`detected ${fix.detectedNote}, snapped to ${fix.targetNote}`);
    else bits.push(`detected ${fix.detectedNote}`);
  }
  return bits.join("; ");
}

export function pitchDict(fix) {
  return {
    id: fix.id,
    kind: "pitch",
    start: fix.start,
    end: fix.end,
    duration: Math.max(0, fix.end - fix.start),
    semitones: fix.semitones || 0,
    cents: fix.cents || 0,
    snap: !!fix.snap,
    action: fix.action || "pitch",
    detected_hz: fix.detectedHz == null ? null : Math.round(fix.detectedHz * 100) / 100,
    detected_note: fix.detectedNote || null,
    target_note: fix.targetNote || null,
    applied_semitones: Math.round((fix.appliedSemitones || 0) * 1000) / 1000,
    summary: describePitch(fix),
  };
}

function yinF0(mono, sr, fmin = 70, fmax = 1000) {
  if (mono.length < Math.round(sr * 0.03)) return null;
  const frame = Math.min(mono.length, Math.max(512, Math.round(sr * 0.04)));
  const hop = Math.max(64, Math.floor(frame / 4));
  const tauMin = Math.max(2, Math.floor(sr / fmax));
  const tauMax = Math.min(frame - 2, Math.floor(sr / fmin));
  if (tauMax <= tauMin + 2) return null;
  const window = hann(frame);
  const estimates = [];
  // Use at most ~3 seconds from the center of the region.
  const maxStart = Math.max(0, mono.length - frame);
  const mid = Math.floor(maxStart / 2);
  const span = Math.min(maxStart, Math.round(sr * 3));
  const first = Math.max(0, mid - Math.floor(span / 2));
  const last = Math.min(maxStart, first + span);
  for (let start = first; start <= last; start += hop) {
    const x = new Float64Array(frame);
    let energy = 0;
    for (let i = 0; i < frame; i += 1) {
      const v = (mono[start + i] || 0) * window[i];
      x[i] = v;
      energy += v * v;
    }
    if (energy / frame < 1e-8) continue;
    const d = new Float64Array(tauMax + 1);
    for (let tau = 1; tau <= tauMax; tau += 1) {
      let sum = 0;
      for (let i = 0; i < frame - tau; i += 1) {
        const diff = x[i] - x[i + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }
    const c = new Float64Array(tauMax + 1);
    c[0] = 1;
    let running = 0;
    for (let tau = 1; tau <= tauMax; tau += 1) {
      running += d[tau];
      c[tau] = running ? (d[tau] * tau) / running : 1;
    }
    let tauHat = null;
    for (let tau = tauMin; tau < tauMax; tau += 1) {
      if (c[tau] < 0.15 && c[tau] < c[tau + 1]) {
        tauHat = tau;
        break;
      }
    }
    if (tauHat == null) {
      let best = tauMin;
      for (let tau = tauMin; tau < tauMax; tau += 1) if (c[tau] < c[best]) best = tau;
      if (c[best] > 0.3) continue;
      tauHat = best;
    }
    if (tauHat >= 1 && tauHat < tauMax) {
      const a = c[tauHat - 1];
      const b = c[tauHat];
      const cv = c[tauHat + 1];
      const denom = a - 2 * b + cv;
      if (Math.abs(denom) > 1e-12) tauHat = tauHat + (0.5 * (a - cv)) / denom;
    }
    estimates.push(sr / tauHat);
  }
  if (!estimates.length) return null;
  estimates.sort((a, b) => a - b);
  const midI = Math.floor(estimates.length / 2);
  return estimates.length % 2 ? estimates[midI] : 0.5 * (estimates[midI - 1] + estimates[midI]);
}

export function resolveShift(audio, fix) {
  const sr = audio.sampleRate;
  const startI = Math.max(0, Math.round(fix.start * sr));
  const endI = Math.min(audio.channels[0].length, Math.round(fix.end * sr));
  const mono = toMono(audio.channels.map((ch) => ch.subarray(startI, endI)));
  const extra = (Number(fix.semitones) || 0) + (Number(fix.cents) || 0) / 100;
  let applied = extra;
  let detected = yinF0(mono, sr);
  let detectedNote = null;
  let targetNote = null;
  if (detected && detected > 0) {
    const midi = hzToMidi(detected);
    detectedNote = midiToNote(midi);
    if (fix.snap) {
      const nearest = Math.round(midi);
      applied = nearest - midi + extra;
      targetNote = midiToNote(nearest);
    }
  } else if (fix.snap && Math.abs(extra) < 1e-9) {
    throw new Error(
      `could not hear a clear pitch in ${formatTime(fix.start)}–${formatTime(fix.end)} to snap to`
    );
  }
  fix.detectedHz = detected;
  fix.detectedNote = detectedNote;
  fix.targetNote = targetNote;
  fix.appliedSemitones = applied;
  return fix;
}

function shiftChannel(input, sr, semitones) {
  if (Math.abs(semitones) < 1e-6) return new Float32Array(input);
  const nFft = nextPow2(Math.max(1024, Math.round(sr * 0.04)));
  const hop = Math.max(64, Math.floor(nFft / 4));
  const window = hann(nFft);
  return shiftChannelClean(input, sr, semitones, nFft, hop, window);
}

function shiftChannelClean(input, sr, semitones, nFft, hop, window) {
  const ratio = 2 ** (semitones / 12);
  const n = input.length;
  const acc = new Float32Array(n + nFft);
  const winAcc = new Float32Array(n + nFft);
  const bins = nFft / 2;
  const lastPhase = new Float64Array(bins + 1);
  const synthPhase = new Float64Array(bins + 1);
  const expected = (2 * Math.PI * hop) / nFft;
  const re = new Float64Array(nFft);
  const im = new Float64Array(nFft);
  const outRe = new Float64Array(nFft);
  const outIm = new Float64Array(nFft);

  for (let pos = 0; pos < n; pos += hop) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < nFft; i += 1) {
      const idx = pos + i;
      re[i] = (idx < n ? input[idx] : 0) * window[i];
    }
    fft(re, im);
    outRe.fill(0);
    outIm.fill(0);
    for (let k = 0; k <= bins; k += 1) {
      const mag = Math.hypot(re[k], im[k]);
      const phase = Math.atan2(im[k], re[k]);
      let delta = phase - lastPhase[k] - expected * k;
      delta -= 2 * Math.PI * Math.round(delta / (2 * Math.PI));
      lastPhase[k] = phase;
      const newBin = Math.round(k * ratio);
      if (newBin < 0 || newBin > bins) continue;
      synthPhase[newBin] += expected * newBin + delta * ratio;
      outRe[newBin] += mag * Math.cos(synthPhase[newBin]);
      outIm[newBin] += mag * Math.sin(synthPhase[newBin]);
    }
    ifft(outRe, outIm);
    for (let i = 0; i < nFft; i += 1) {
      const idx = pos + i;
      if (idx >= acc.length) break;
      acc[idx] += outRe[i] * window[i];
      winAcc[idx] += window[i] * window[i];
    }
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = winAcc[i] > 1e-8 ? acc[i] / winAcc[i] : 0;
  return out;
}

function equalPowerFades(n) {
  const fadeOut = new Float32Array(n);
  const fadeIn = new Float32Array(n);
  if (n <= 0) return [fadeOut, fadeIn];
  if (n === 1) {
    fadeOut[0] = 0;
    fadeIn[0] = 1;
    return [fadeOut, fadeIn];
  }
  for (let i = 0; i < n; i += 1) {
    const t = (i / (n - 1)) * (Math.PI / 2);
    fadeOut[i] = Math.cos(t);
    fadeIn[i] = Math.sin(t);
  }
  return [fadeOut, fadeIn];
}

export function applyPitchFixes(audio, fixes, crossfadeMs = 10) {
  const sr = audio.sampleRate;
  const out = audio.channels.map((ch) => new Float32Array(ch));
  const n = out[0].length;
  const fadeN = Math.max(1, Math.round(sr * (crossfadeMs / 1000)));
  for (const fix of fixes) {
    if (fix.action === "keep") continue;
    const amount = fix.appliedSemitones || 0;
    if (Math.abs(amount) < 1e-6) continue;
    const startI = Math.max(0, Math.round(fix.start * sr));
    const endI = Math.min(n, Math.round(fix.end * sr));
    if (endI - startI < fadeN * 2 + 2) continue;
    const nFade = Math.min(fadeN, Math.floor((endI - startI) / 3));
    const [fadeOut, fadeIn] = equalPowerFades(nFade);
    for (let c = 0; c < out.length; c += 1) {
      const region = out[c].subarray(startI, endI);
      const orig = new Float32Array(region);
      const shifted = shiftChannel(orig, sr, amount);
      const len = region.length;
      for (let i = 0; i < len; i += 1) {
        let s = shifted[i] || 0;
        if (i < nFade) s = orig[i] * fadeOut[i] + s * fadeIn[i];
        else if (i >= len - nFade) {
          const k = i - (len - nFade);
          s = s * fadeOut[k] + orig[i] * fadeIn[k];
        }
        region[i] = s;
      }
    }
  }
  return { sampleRate: sr, channels: out };
}
