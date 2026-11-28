/** Parse start and end times like 1:02, 1:07.5, or 67. */

export class TimeError extends Error {}

export function parseTime(text) {
  let raw = String(text || "").trim().toLowerCase();
  raw = raw.replace(/seconds?/g, "").replace(/s$/g, "").trim();
  if (!raw) throw new TimeError("enter a time, like 1:02 or 5");
  if ((raw.match(/:/g) || []).length > 1) {
    throw new TimeError(`use minutes:seconds, like 1:07, not ${text}`);
  }
  if (raw.includes(":")) {
    const [minutes, seconds] = raw.split(":", 2);
    const m = Number(minutes);
    const s = Number(seconds);
    if (!Number.isFinite(m) || !Number.isFinite(s)) {
      throw new TimeError(`could not read time ${text}`);
    }
    return m * 60 + s;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new TimeError(`could not read time ${text}`);
  return n;
}

export function parseSpan(text) {
  const raw = String(text || "").trim();
  const parts = raw.split(/\s*[-–—]|(\s+to\s+)\s*/).filter((p) => p && !/^\s+to\s+$/.test(p));
  const bits = raw.split(/\s*(?:[-–—]|\bto\b)\s*/);
  if (bits.length !== 2 || !bits[0] || !bits[1]) {
    throw new TimeError("use a range like 1:02-1:07 or 3-8");
  }
  const start = parseTime(bits[0]);
  const end = parseTime(bits[1]);
  if (end <= start) throw new TimeError("the end time must be after the start");
  return [start, end];
}

export function formatTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(s / 60);
  const rem = s - minutes * 60;
  if (minutes) return `${minutes}:${rem.toFixed(2).padStart(5, "0")}`;
  return `${s.toFixed(2)}s`;
}

export function formatSeconds(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(s / 60);
  const rem = s - minutes * 60;
  if (minutes) return `${minutes}:${rem.toFixed(2).padStart(5, "0")} (${s.toFixed(2)} seconds)`;
  return `${s.toFixed(2)} seconds`;
}
