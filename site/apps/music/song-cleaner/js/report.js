/** Plain cleaning report. Never includes the audio. */

import { formatSeconds } from "./times.js";
import { triggerLabels } from "./detect.js";
import { pitchDict } from "./pitch.js";
import { describePolish } from "./polish.js";

export const NOTHING_FOUND = "No artifacts found, nothing was changed.";

function denverStamp(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} MST (America/Denver)`;
}

function isManual(spot) {
  return spot.kind === "manual" || (spot.measures || []).includes("manual");
}

function counts(spots) {
  let cut = 0;
  let kept = 0;
  let removed = 0;
  for (const spot of spots) {
    if ((spot.action || "cut") === "keep") kept += 1;
    else {
      cut += 1;
      removed += Number(spot.duration != null ? spot.duration : spot.end - spot.start) || 0;
    }
  }
  return { found: spots.length, cut, kept, removed };
}

function pitchChanged(fixes) {
  return (fixes || []).filter((f) => {
    const data = f.applied_semitones != null ? f : pitchDict(f);
    if (data.action === "keep") return false;
    return Math.abs(Number(data.applied_semitones) || 0) >= 1e-6 || data.snap;
  });
}

export function headline(spots, opts = {}) {
  const auto = (spots || []).filter((s) => !isManual(s));
  const manual = (spots || []).filter((s) => isManual(s));
  const a = counts(auto);
  const m = counts(manual);
  const pitches = pitchChanged(opts.pitchFixes || []);
  const polish = opts.polish || {};
  const parts = [];
  if (a.found) {
    parts.push(
      `${a.found} spot${a.found === 1 ? "" : "s"} found, ${a.cut} cut, ${a.kept} kept. ${a.removed.toFixed(2)} seconds removed`
    );
  }
  if (manual.length) {
    parts.push(`${m.cut} manual cut${m.cut === 1 ? "" : "s"} (${m.removed.toFixed(2)} seconds removed)`);
  }
  if (pitches.length) parts.push(`${pitches.length} bad-note fix${pitches.length === 1 ? "" : "es"}`);
  if (polish.lift_name || polish.balance_name) {
    const bits = [polish.lift_name, polish.balance_name].filter(Boolean);
    const extra = polish.lufs_after != null ? `, measured ${Number(polish.lufs_after).toFixed(1)} LUFS` : "";
    parts.push(`polish: ${bits.join(" + ")}${extra}`);
  }
  const changed =
    a.cut + m.cut > 0 || pitches.length > 0 || !!(polish.lift_name || polish.balance_name);
  // If nothing was actually changed, say so plainly even when spots were found and kept.
  if (!changed) {
    if (opts.anythingWritten) return "No artifacts were cut. The copy is identical to the original.";
    return NOTHING_FOUND;
  }
  return `${parts.join(". ")}.`;
}

export function buildReport({
  song,
  spots = [],
  pitchFixes = [],
  polish = null,
  durationBefore,
  durationAfter,
  audioWritten = false,
}) {
  const auto = spots.filter((s) => !isManual(s));
  const manual = spots.filter((s) => isManual(s));
  const a = counts(auto);
  const m = counts(manual);
  const pitchList = pitchFixes.map((f) => (f.summary ? f : pitchDict(f)));
  const polishDict = polish ? { ...polish, summary: polish.summary || describePolish(polish) } : {};
  const unchanged =
    a.cut + m.cut === 0 && !pitchChanged(pitchList).length && !polishDict.lift && !polishDict.balance;
  return {
    when: denverStamp(),
    song,
    audio_written: audioWritten,
    unchanged,
    headline: headline(spots, { pitchFixes: pitchList, polish: polishDict, anythingWritten: audioWritten && unchanged }),
    length_before_seconds: Math.round(durationBefore * 10000) / 10000,
    length_after_seconds: Math.round(durationAfter * 10000) / 10000,
    spots_found: a.found,
    spots_cut: a.cut,
    spots_kept: a.kept,
    manual_cuts: m.cut,
    seconds_removed: Math.round((a.removed + m.removed) * 10000) / 10000,
    spots: auto,
    manual,
    pitch_fixes: pitchList,
    polish: polishDict,
  };
}

export function formatPlain(report) {
  const lines = [
    `Cleaning report for ${report.song || "song"}`,
    "",
    report.headline || NOTHING_FOUND,
    "",
    `Length before: ${formatSeconds(report.length_before_seconds || 0)}`,
    `Length after: ${formatSeconds(report.length_after_seconds || 0)}`,
    `Spots found: ${report.spots_found || 0}`,
    `Spots cut: ${report.spots_cut || 0}`,
    `Spots kept: ${report.spots_kept || 0}`,
    `Time removed: ${(report.seconds_removed || 0).toFixed(2)} seconds`,
  ];
  if (report.spots && report.spots.length) {
    lines.push("", "Spots", "");
    for (const spot of report.spots) {
      const trigger = spot.trigger || triggerLabels(spot.measures || []);
      lines.push(
        `#${spot.id}  ${(spot.start || 0).toFixed(2)}s–${(spot.end || 0).toFixed(2)}s  ${(spot.duration || 0).toFixed(2)}s  ${trigger}  ${spot.action || "cut"}  re-checks: ${spot.passes || 0}`
      );
    }
  }
  if (report.manual && report.manual.length) {
    lines.push("", "Manual cuts", "");
    for (const spot of report.manual) {
      lines.push(
        `#${spot.id}  ${(spot.start || 0).toFixed(2)}s–${(spot.end || 0).toFixed(2)}s  ${(spot.duration || 0).toFixed(2)}s  ${spot.action || "cut"}`
      );
    }
  }
  if (report.pitch_fixes && report.pitch_fixes.length) {
    lines.push("", "Bad-note fixes", "");
    for (const fix of report.pitch_fixes) lines.push(`#${fix.id}  ${fix.summary || "pitch shift"}`);
  }
  if (report.polish && (report.polish.lift || report.polish.balance)) {
    lines.push("", "Polish", "", report.polish.summary || "preset applied");
  }
  if (report.audio_written) lines.push("", "A cleaned WAV is ready to download.");
  else if (report.unchanged) lines.push("", "No cleaned copy was written.");
  lines.push("The original file was not changed.", "");
  return lines.join("\n");
}

export function formatMarkdown(report) {
  const lines = [
    `# Cleaning report for ${report.song || "song"}`,
    "",
    report.headline || NOTHING_FOUND,
    "",
    `- **When:** ${report.when}`,
    `- **Length before:** ${formatSeconds(report.length_before_seconds || 0)}`,
    `- **Length after:** ${formatSeconds(report.length_after_seconds || 0)}`,
    `- **Spots found:** ${report.spots_found || 0}`,
    `- **Spots cut:** ${report.spots_cut || 0}`,
    `- **Spots kept:** ${report.spots_kept || 0}`,
    `- **Manual cuts:** ${report.manual_cuts || 0}`,
    `- **Bad-note fixes:** ${(report.pitch_fixes || []).length}`,
    `- **Time removed:** ${(report.seconds_removed || 0).toFixed(2)} seconds`,
    `- **Cleaned file:** ${report.audio_written ? "ready to download as WAV" : "not written"}`,
    `- **Original file:** not changed`,
    "",
  ];
  if (report.spots && report.spots.length) {
    lines.push("## Spots", "", "| # | Start–end | Length | Trigger | Action | Re-checks |", "| --- | --- | ---: | --- | --- | ---: |");
    for (const spot of report.spots) {
      const trigger = spot.trigger || triggerLabels(spot.measures || []);
      lines.push(
        `| ${spot.id} | ${(spot.start || 0).toFixed(2)}s–${(spot.end || 0).toFixed(2)}s | ${(spot.duration || 0).toFixed(2)}s | ${trigger} | ${spot.action || "cut"} | ${spot.passes || 0} |`
      );
    }
    lines.push("");
  }
  if (report.manual && report.manual.length) {
    lines.push("## Manual cuts", "", "| # | Start–end | Length | Action |", "| --- | --- | ---: | --- |");
    for (const spot of report.manual) {
      lines.push(
        `| ${spot.id} | ${(spot.start || 0).toFixed(2)}s–${(spot.end || 0).toFixed(2)}s | ${(spot.duration || 0).toFixed(2)}s | ${spot.action || "cut"} |`
      );
    }
    lines.push("");
  }
  if (report.pitch_fixes && report.pitch_fixes.length) {
    lines.push("## Bad-note fixes", "", "| # | Start–end | Shift | Notes |", "| --- | --- | --- | --- |");
    for (const fix of report.pitch_fixes) {
      const shift = Number(fix.applied_semitones || 0);
      lines.push(
        `| ${fix.id} | ${(fix.start || 0).toFixed(2)}s–${(fix.end || 0).toFixed(2)}s | ${shift >= 0 ? "+" : ""}${shift.toFixed(2)} semitones | ${fix.summary || ""} |`
      );
    }
    lines.push("");
  }
  if (report.polish && (report.polish.lift || report.polish.balance)) {
    lines.push("## Polish", "", report.polish.summary || "preset applied", "");
  }
  return lines.join("\n");
}
