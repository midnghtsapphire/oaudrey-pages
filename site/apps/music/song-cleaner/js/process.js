/** Apply pitch, then cuts, then polish. The original buffers are never modified. */

import { applyCuts } from "./cut.js";
import { makeManualCut, prepareSpots } from "./detect.js";
import { applyPitchFixes, resolveShift, pitchDict } from "./pitch.js";
import { applyPolish } from "./polish.js";
import { buildReport } from "./report.js";

export function spotsToCut(spots) {
  return (spots || []).filter((s) => s.action !== "keep");
}

export function attachManualCuts(spots, cuts, duration) {
  const out = (spots || []).slice();
  let nextId = out.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1;
  for (const item of cuts || []) {
    const start = item.start != null ? item.start : item[0];
    const end = item.end != null ? item.end : item[1];
    const cut = makeManualCut(start, end, nextId, duration);
    nextId += 1;
    out.push(cut);
  }
  return out;
}

export function willChange(spots, pitchFixes, lift, balance) {
  if (spotsToCut(spots).length) return true;
  if (lift || balance) return true;
  for (const fix of pitchFixes || []) {
    if (fix.action !== "keep" && Math.abs(fix.appliedSemitones || 0) >= 1e-6) return true;
  }
  return false;
}

export function applyAll(audio, { spots = [], pitchFixes = [], lift = null, balance = null, crossfadeMs = 10 } = {}) {
  let work = { sampleRate: audio.sampleRate, channels: audio.channels.map((ch) => new Float32Array(ch)) };
  const fixes = (pitchFixes || []).map((f) => ({ ...f }));
  for (const fix of fixes) if (fix.action !== "keep") resolveShift(work, fix);
  const active = fixes.filter((f) => f.action !== "keep" && Math.abs(f.appliedSemitones || 0) >= 1e-6);
  if (active.length) work = applyPitchFixes(work, active, crossfadeMs);
  if (spotsToCut(spots).length) work = applyCuts(work, spots, crossfadeMs);
  let polish = null;
  if (lift || balance) {
    const [out, info] = applyPolish(work, lift, balance);
    work = out;
    polish = info;
  }
  return { audio: work, pitchFixes: fixes, polish };
}

export function processAudio(audio, opts = {}) {
  const detect = opts.detect !== false;
  const thresholds = opts.thresholds;
  let spots = opts.spots || (detect ? prepareSpots(audio, thresholds, opts.keepIds || []) : []);
  const durationBefore = audio.channels[0].length / audio.sampleRate;
  if (opts.manualCuts && opts.manualCuts.length) {
    spots = attachManualCuts(spots, opts.manualCuts, durationBefore);
  }
  const applied = applyAll(audio, {
    spots,
    pitchFixes: opts.pitchFixes || [],
    lift: opts.lift || null,
    balance: opts.balance || null,
    crossfadeMs: (thresholds && thresholds.crossfade_ms) || 10,
  });
  const changed = willChange(spots, applied.pitchFixes, opts.lift, opts.balance);
  const durationAfter = changed ? applied.audio.channels[0].length / audio.sampleRate : durationBefore;
  const report = buildReport({
    song: opts.song || "song",
    spots,
    pitchFixes: applied.pitchFixes.map(pitchDict),
    polish: applied.polish,
    durationBefore,
    durationAfter,
    audioWritten: !!changed,
  });
  return {
    spots,
    pitchFixes: applied.pitchFixes,
    polish: applied.polish,
    cleaned: changed ? applied.audio : null,
    durationBefore,
    durationAfter,
    audioWritten: !!changed,
    report,
  };
}
