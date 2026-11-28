/** Detect short artifact bursts. Same measures as the Python tool, as far as the browser allows. */

import { rfftMag, hann, nextPow2 } from "./fft.js";
import { toMono } from "./wav.js";
import { applyCuts } from "./cut.js";

export const DEFAULT_THRESHOLDS = {
  flux_k: 6,
  flatness_k: 4,
  hf_k: 5,
  discontinuity_k: 12,
  clip_amp: 0.999,
  min_clip_run_ms: 2,
  hf_cutoff_hz: 8000,
  flatness_min: 0.15,
  hf_min: 0.3,
  frame_ms: 40,
  hop_ms: 10,
  min_spot_ms: 30,
  merge_gap_ms: 100,
  initial_pad_ms: 50,
  max_spot_s: 3,
  crossfade_ms: 10,
  reanalyze_window_ms: 150,
  extend_step_ms: 80,
};

export const TRIGGER_LABELS = {
  clipping: "clipping",
  discontinuity: "discontinuity",
  flux: "spike",
  flatness: "noisy burst",
  hf_energy: "high-frequency burst",
  manual: "manual cut",
};

export function triggerLabels(measures) {
  const labels = [];
  for (const name of measures || []) {
    const label = TRIGGER_LABELS[name] || name;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels.length ? labels.join(", ") : "unspecified";
}

export function makeManualCut(start, end, id, duration) {
  start = Math.max(0, Number(start));
  end = Number(end);
  if (duration != null) end = Math.min(duration, end);
  if (end <= start) throw new Error("the end time must be after the start");
  return {
    id,
    start,
    end,
    duration: end - start,
    peak: (start + end) / 2,
    measures: ["manual"],
    action: "cut",
    extended: false,
    leftover: false,
    passes: 0,
    kind: "manual",
    trigger: "manual cut",
  };
}

export function spotDict(spot) {
  const duration = Math.max(0, spot.end - spot.start);
  return {
    ...spot,
    start: Math.round(spot.start * 10000) / 10000,
    end: Math.round(spot.end * 10000) / 10000,
    duration: Math.round(duration * 10000) / 10000,
    trigger: spot.trigger || triggerLabels(spot.measures),
  };
}

function robustZ(values) {
  const sorted = Array.from(values).sort((a, b) => a - b);
  const mid = (arr) => {
    const n = arr.length;
    if (!n) return 0;
    return n % 2 ? arr[(n - 1) >> 1] : 0.5 * (arr[n / 2 - 1] + arr[n / 2]);
  };
  const median = mid(sorted);
  const dev = Array.from(values, (v) => Math.abs(v - median)).sort((a, b) => a - b);
  let scale = 1.4826 * mid(dev);
  if (scale < 1e-12) {
    let mean = 0;
    for (const v of values) mean += v;
    mean /= values.length || 1;
    let varSum = 0;
    for (const v of values) varSum += (v - mean) * (v - mean);
    scale = Math.sqrt(varSum / (values.length || 1)) + 1e-12;
  }
  const out = new Float32Array(values.length);
  for (let i = 0; i < values.length; i += 1) out[i] = (values[i] - median) / scale;
  return out;
}

function clipRuns(mono, sr, amp, minRunMs) {
  const minRun = Math.max(1, Math.round((sr * minRunMs) / 1000));
  const runs = [];
  let i = 0;
  while (i < mono.length) {
    if (Math.abs(mono[i]) < amp) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < mono.length && Math.abs(mono[j]) >= amp) j += 1;
    if (j - i >= minRun) runs.push([i / sr, j / sr]);
    i = j;
  }
  return runs;
}

function clickRuns(mono, sr, k, maxRunMs = 6) {
  if (mono.length < 8) return [];
  const maxRun = Math.max(2, Math.round((sr * maxRunMs) / 1000));
  const win = Math.max(8, Math.round(sr * 0.02));
  const residual = new Float32Array(mono.length - 2);
  for (let i = 1; i < mono.length - 1; i += 1) {
    residual[i - 1] = Math.abs(mono[i] - 0.5 * (mono[i - 1] + mono[i + 1]));
  }
  const env = new Float32Array(mono.length);
  let acc = 0;
  for (let i = 0; i < mono.length; i += 1) {
    acc += mono[i] * mono[i];
    if (i >= win) acc -= mono[i - win] * mono[i - win];
    const count = Math.min(i + 1, win);
    env[i] = Math.sqrt(acc / count + 1e-12);
  }
  const flagged = new Uint8Array(residual.length);
  for (let i = 0; i < residual.length; i += 1) {
    flagged[i] = residual[i] / env[i + 1] >= k ? 1 : 0;
  }
  const runs = [];
  let i = 0;
  while (i < flagged.length) {
    if (!flagged[i]) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < flagged.length && flagged[j]) j += 1;
    const width = j - i;
    if (width >= 1 && width <= maxRun) runs.push([(i + 1) / sr, (j + 1) / sr]);
    i = j;
  }
  return runs;
}

function mergeIntervals(intervals, mergeGap, minDur, maxDur) {
  if (!intervals.length) return [];
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (let [start, end, peak, measures] of sorted) {
    if (end - start < minDur) {
      const mid = (start + end) / 2;
      start = mid - minDur / 2;
      end = mid + minDur / 2;
    }
    const last = merged[merged.length - 1];
    if (!last || start > last[1] + mergeGap) {
      merged.push([start, end, peak, measures.slice()]);
      continue;
    }
    last[1] = Math.max(last[1], end);
    for (const name of measures) if (!last[3].includes(name)) last[3].push(name);
  }
  return merged.map(([start, end, peak, measures]) => {
    if (end - start > maxDur) {
      const half = maxDur / 2;
      start = Math.max(start, peak - half);
      end = Math.min(end, start + maxDur);
      if (end - start < maxDur) start = Math.max(0, end - maxDur);
    }
    peak = Math.min(Math.max(peak, start), end);
    return [start, end, peak, measures];
  });
}

export function analyzeFrames(audio, thresholds = DEFAULT_THRESHOLDS) {
  const th = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const mono = toMono(audio.channels);
  const sr = audio.sampleRate;
  const nFftWanted = Math.max(16, Math.round((sr * th.frame_ms) / 1000));
  const nFft = nextPow2(nFftWanted);
  const hop = Math.max(1, Math.round((sr * th.hop_ms) / 1000));
  const window = hann(nFft);
  const nFrames = mono.length < nFft ? 1 : 1 + Math.floor((mono.length - nFft) / hop);
  const flux = new Float32Array(nFrames);
  const flatness = new Float32Array(nFrames);
  const hfRatio = new Float32Array(nFrames);
  const times = new Float32Array(nFrames);
  const half = (nFft >> 1) + 1;
  const hfCutoffBin = Math.ceil((th.hf_cutoff_hz * nFft) / sr);
  let prevBand = null;
  const frame = new Float32Array(nFft);
  const eps = 1e-12;

  for (let f = 0; f < nFrames; f += 1) {
    const start = f * hop;
    frame.fill(0);
    const take = Math.min(nFft, mono.length - start);
    for (let i = 0; i < take; i += 1) frame[i] = mono[start + i] * window[i];
    const mag = rfftMag(frame);
    times[f] = start / sr;
    let geoLog = 0;
    let arith = 0;
    let fluxSum = 0;
    let hf = 0;
    let total = 0;
    const bins = half - 1;
    for (let k = 1; k < half; k += 1) {
      const v = mag[k];
      arith += v;
      geoLog += Math.log(v + eps);
      if (prevBand) fluxSum += Math.max(v - prevBand[k - 1], 0);
      total += v;
      if (k >= hfCutoffBin) hf += v;
    }
    // include DC in total/hf like Python (hf uses all mag bins; flatness skips DC)
    total += mag[0];
    if (0 >= hfCutoffBin) hf += mag[0];
    flux[f] = f === 0 ? 0 : fluxSum;
    const geometric = Math.exp(geoLog / Math.max(1, bins));
    flatness[f] = geometric / (arith / Math.max(1, bins) + eps);
    hfRatio[f] = hf / (total + eps);
    prevBand = mag.subarray(1).slice();
  }

  const zFlux = robustZ(flux);
  const zFlat = robustZ(flatness);
  const zHf = robustZ(hfRatio);
  const flagged = new Uint8Array(nFrames);
  const noisy = new Uint8Array(nFrames);
  for (let f = 0; f < nFrames; f += 1) {
    const burst =
      zFlux[f] >= th.flux_k &&
      ((zFlat[f] >= th.flatness_k && flatness[f] >= th.flatness_min) ||
        (zHf[f] >= th.hf_k && hfRatio[f] >= th.hf_min));
    noisy[f] = burst ? 1 : 0;
    flagged[f] = burst ? 1 : 0;
  }
  return { times, hop, nFft, flux, flatness, hfRatio, zFlux, zFlat, zHf, flagged, noisy };
}

export function detectSpots(audio, thresholds = DEFAULT_THRESHOLDS) {
  const th = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const mono = toMono(audio.channels);
  const sr = audio.sampleRate;
  const duration = mono.length / sr;
  const analysis = analyzeFrames(audio, th);
  const hopS = analysis.hop / sr;
  const frameS = analysis.nFft / sr;
  const raw = [];
  const flagged = analysis.flagged;
  let i = 0;
  while (i < flagged.length) {
    if (!flagged[i]) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < flagged.length && flagged[j]) j += 1;
    const measures = [];
    let anyFlat = false;
    let anyHf = false;
    let anyFlux = false;
    let peakIdx = i;
    let peakVal = -Infinity;
    for (let k = i; k < j; k += 1) {
      if (analysis.noisy[k]) {
        if (analysis.zFlat[k] >= th.flatness_k) anyFlat = true;
        if (analysis.zHf[k] >= th.hf_k) anyHf = true;
        if (analysis.zFlux[k] >= th.flux_k) anyFlux = true;
      }
      const score = analysis.zFlux[k];
      if (score > peakVal) {
        peakVal = score;
        peakIdx = k;
      }
    }
    if (anyFlat) measures.push("flatness");
    if (anyHf) measures.push("hf_energy");
    if (anyFlux) measures.push("flux");
    const pad = th.initial_pad_ms / 1000;
    const start = Math.max(0, analysis.times[i] - pad);
    const end = Math.min(duration, analysis.times[j - 1] + frameS + pad);
    const peak = analysis.times[peakIdx] + hopS / 2;
    raw.push([start, end, peak, measures.length ? measures : ["flux"]]);
    i = j;
  }
  for (const [start, end] of clipRuns(mono, sr, th.clip_amp, th.min_clip_run_ms)) {
    const pad = th.initial_pad_ms / 1000;
    raw.push([Math.max(0, start - pad), Math.min(duration, end + pad), (start + end) / 2, ["clipping"]]);
  }
  for (const [start, end] of clickRuns(mono, sr, th.discontinuity_k)) {
    const pad = th.initial_pad_ms / 1000;
    raw.push([Math.max(0, start - pad), Math.min(duration, end + pad), (start + end) / 2, ["discontinuity"]]);
  }
  const merged = mergeIntervals(raw, th.merge_gap_ms / 1000, th.min_spot_ms / 1000, th.max_spot_s);
  return merged.map(([start, end, peak, measures], idx) => {
    const s = Math.max(0, Math.min(start, duration));
    const e = Math.max(s, Math.min(end, duration));
    return {
      id: idx + 1,
      start: s,
      end: e,
      duration: e - s,
      peak: Math.min(Math.max(peak, s), e),
      measures,
      action: "cut",
      extended: false,
      leftover: false,
      passes: 0,
      kind: "auto",
      trigger: triggerLabels(measures),
    };
  });
}

function joinIsClean(preview, sr, joinTime, th) {
  const window = th.reanalyze_window_ms / 1000;
  const start = Math.max(0, joinTime - window);
  const end = Math.min(preview.channels[0].length / sr, joinTime + window);
  if (end - start < 0.02) return true;
  const snippet = {
    sampleRate: sr,
    channels: preview.channels.map((ch) =>
      ch.slice(Math.round(start * sr), Math.round(end * sr))
    ),
  };
  const analysis = analyzeFrames(snippet, th);
  for (let i = 0; i < analysis.flagged.length; i += 1) if (analysis.flagged[i]) return false;
  const mono = toMono(snippet.channels);
  if (clipRuns(mono, sr, th.clip_amp, th.min_clip_run_ms).length) return false;
  if (clickRuns(mono, sr, th.discontinuity_k).length) return false;
  return true;
}

export function refineSpots(audio, spots, thresholds = DEFAULT_THRESHOLDS) {
  const th = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const duration = audio.channels[0].length / audio.sampleRate;
  const step = th.extend_step_ms / 1000;
  const maxDur = th.max_spot_s;
  const refined = [];
  spots.forEach((spot, idx) => {
    const current = { ...spot, id: idx + 1, measures: (spot.measures || []).slice() };
    if (current.action === "keep" || current.kind === "manual") {
      refined.push(current);
      return;
    }
    let passes = 0;
    while (true) {
      passes += 1;
      const preview = applyCuts(audio, [current], th.crossfade_ms);
      if (current.end - current.start >= maxDur - 1e-6) {
        current.leftover = !joinIsClean(preview, audio.sampleRate, current.start, th);
        break;
      }
      if (joinIsClean(preview, audio.sampleRate, current.start, th)) break;
      let newStart = Math.max(0, current.start - step);
      let newEnd = Math.min(duration, current.end + step);
      if (newEnd - newStart > maxDur) {
        const half = maxDur / 2;
        newStart = Math.min(Math.max(0, current.peak - half), Math.max(0, duration - maxDur));
        newEnd = Math.min(duration, newStart + maxDur);
      }
      if (newStart === current.start && newEnd === current.end) {
        current.leftover = true;
        break;
      }
      current.start = newStart;
      current.end = newEnd;
      current.duration = newEnd - newStart;
      current.extended = true;
      if (passes > 40) break;
    }
    current.passes = passes;
    refined.push(current);
  });
  refined.sort((a, b) => a.start - b.start);
  const merged = [];
  const gap = th.merge_gap_ms / 1000;
  for (const spot of refined) {
    const prev = merged[merged.length - 1];
    if (spot.action === "keep" || spot.kind === "manual" || !prev || prev.action === "keep" || prev.kind === "manual") {
      merged.push(spot);
      continue;
    }
    if (spot.start <= prev.end + gap) {
      prev.end = Math.max(prev.end, spot.end);
      prev.duration = prev.end - prev.start;
      prev.passes = Math.max(prev.passes || 0, spot.passes || 0);
      for (const name of spot.measures || []) if (!prev.measures.includes(name)) prev.measures.push(name);
      prev.trigger = triggerLabels(prev.measures);
      if (prev.end - prev.start > maxDur) {
        prev.end = prev.start + maxDur;
        prev.duration = maxDur;
      }
    } else merged.push(spot);
  }
  return merged.map((s, i) => ({ ...s, id: i + 1, trigger: triggerLabels(s.measures) }));
}

export function prepareSpots(audio, thresholds = DEFAULT_THRESHOLDS, keepIds = []) {
  const keep = new Set(keepIds);
  const spots = refineSpots(audio, detectSpots(audio, thresholds), thresholds);
  for (const spot of spots) if (keep.has(spot.id)) spot.action = "keep";
  return spots;
}
