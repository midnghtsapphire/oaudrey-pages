import { parseTime, formatTime } from "./times.js";
import { encodeWav, audioFromBuffer, cloneChannels } from "./wav.js";
import { prepareSpots, triggerLabels } from "./detect.js";
import { applyCuts, sliceSeconds } from "./cut.js";
import { listPresets } from "./polish.js";
import { processAudio, applyAll, attachManualCuts } from "./process.js";
import { formatPlain, formatMarkdown, NOTHING_FOUND } from "./report.js";

const $ = (id) => document.getElementById(id);
const state = {
  name: "",
  original: null,
  spots: [],
  cuts: [],
  pitches: [],
  lift: "",
  balance: "",
  report: null,
  result: null,
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let player = null;

function status(msg, isError) {
  $("status").textContent = msg || "";
  $("status").className = isError ? "error" : "";
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function toBuffer(audio) {
  const buf = audioCtx.createBuffer(audio.channels.length, audio.channels[0].length, audio.sampleRate);
  audio.channels.forEach((ch, i) => buf.copyToChannel(ch, i));
  return buf;
}

function playAudio(audio, start, end) {
  if (player) {
    try { player.stop(); } catch (err) { /* already stopped */ }
  }
  const buf = toBuffer(audio);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.connect(audioCtx.destination);
  const a = Math.max(0, start);
  const b = Math.min(buf.duration, end);
  src.start(0, a, Math.max(0.05, b - a));
  player = src;
}

$("pick").onclick = () => $("file").click();
$("file").onchange = () => {
  if ($("file").files[0]) openFile($("file").files[0]);
};

const drop = $("drop");
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("drag");
});
drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("drag");
  if (e.dataTransfer.files[0]) openFile(e.dataTransfer.files[0]);
});

async function openFile(file) {
  status("Opening the song in your browser…");
  $("results").classList.add("hidden");
  try {
    if (audioCtx.state === "suspended") await audioCtx.resume();
    const raw = await file.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(raw.slice(0));
    const original = audioFromBuffer(buffer);
    state.name = file.name;
    state.original = original;
    state.cuts = [];
    state.pitches = [];
    state.lift = "";
    state.balance = "";
    status("Listening for short glitches…");
    await new Promise((r) => setTimeout(r, 20));
    state.spots = prepareSpots(original);
    $("song-name").textContent = file.name;
    renderPresets();
    renderRows();
    renderCuts();
    renderPitches();
    $("spots-empty").classList.toggle("hidden", state.spots.length > 0);
    $("spots-table").classList.toggle("hidden", state.spots.length === 0);
    $("results").classList.remove("hidden");
    refresh();
    status("");
  } catch (err) {
    status(err.message || String(err), true);
  }
}

function currentSpots() {
  if (!state.original) return [];
  const duration = state.original.channels[0].length / state.original.sampleRate;
  return attachManualCuts(state.spots, state.cuts, duration);
}

function refresh() {
  if (!state.original) return;
  try {
    const result = processAudio(state.original, {
      song: state.name,
      detect: false,
      spots: state.spots.map((s) => ({ ...s })),
      manualCuts: state.cuts,
      pitchFixes: state.pitches.map((p) => ({ ...p })),
      lift: state.lift || null,
      balance: state.balance || null,
    });
    state.result = result;
    state.report = result.report;
    $("report").textContent = formatPlain(result.report);
    const wavBtn = $("download-wav");
    wavBtn.disabled = !result.audioWritten;
    $("save-note").textContent = result.audioWritten
      ? "Download puts a new WAV on your computer. The file you opened is not changed."
      : NOTHING_FOUND + " The original file was not changed.";
    if (result.pitchFixes) {
      result.pitchFixes.forEach((fix, i) => {
        if (state.pitches[i]) Object.assign(state.pitches[i], fix);
      });
      renderPitches();
    }
    status("");
  } catch (err) {
    status(err.message || String(err), true);
  }
}

function renderRows() {
  const rows = $("rows");
  rows.innerHTML = "";
  state.spots.forEach((spot) => {
    const tr = document.createElement("tr");
    const action = spot.action || "cut";
    const why = spot.trigger || triggerLabels(spot.measures || []);
    tr.innerHTML = `
      <td>${spot.id}</td>
      <td>${formatTime(spot.start)} – ${formatTime(spot.end)}</td>
      <td>${Number(spot.duration).toFixed(2)}s</td>
      <td>${why}</td>
      <td>${spot.passes || 0}</td>
      <td>
        <button type="button" class="secondary" data-play="original" data-id="${spot.id}">Before</button>
        <button type="button" class="secondary" data-play="cleaned" data-id="${spot.id}">After</button>
      </td>
      <td>
        <span class="toggle">
          <button type="button" data-act="cut" data-id="${spot.id}" class="${action === "cut" ? "on-cut" : "off"}">Cut</button>
          <button type="button" data-act="keep" data-id="${spot.id}" class="${action === "keep" ? "on-keep" : "off"}">Keep</button>
        </span>
      </td>`;
    rows.appendChild(tr);
  });
}

$("rows").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const spot = state.spots.find((s) => s.id === id);
  if (!spot) return;
  if (btn.dataset.act) {
    spot.action = btn.dataset.act;
    renderRows();
    refresh();
    return;
  }
  if (btn.dataset.play) playRegion(spot.start, spot.end, btn.dataset.play);
});

function renderCuts() {
  const list = $("cut-list");
  list.innerHTML = "";
  state.cuts.forEach((cut, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${formatTime(cut.start)} – ${formatTime(cut.end)} (${(cut.end - cut.start).toFixed(2)}s)
      <button type="button" class="secondary" data-cut-play="${i}">Preview</button>
      <button type="button" class="secondary" data-cut-del="${i}">Remove</button>`;
    list.appendChild(li);
  });
}

function renderPitches() {
  const list = $("pitch-list");
  list.innerHTML = "";
  state.pitches.forEach((fix, i) => {
    const label = fix.summary || `${formatTime(fix.start)} – ${formatTime(fix.end)}`;
    const li = document.createElement("li");
    li.innerHTML = `${label}
      <button type="button" class="secondary" data-pitch-play="${i}">Preview</button>
      <button type="button" class="secondary" data-pitch-del="${i}">Remove</button>`;
    list.appendChild(li);
  });
}

function renderPresets() {
  const lifts = $("lift-row");
  const bals = $("balance-row");
  lifts.querySelectorAll("button[data-lift]:not([data-lift=''])").forEach((b) => b.remove());
  bals.querySelectorAll("button[data-balance]:not([data-balance=''])").forEach((b) => b.remove());
  listPresets().forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset";
    btn.textContent = p.name;
    btn.title = p.blurb;
    if (p.group === "lift") {
      btn.dataset.lift = p.id;
      lifts.appendChild(btn);
    } else {
      btn.dataset.balance = p.id;
      bals.appendChild(btn);
    }
  });
  markPresets();
}

function markPresets() {
  document.querySelectorAll("#lift-row button").forEach((b) => {
    b.classList.toggle("on", (b.dataset.lift || "") === (state.lift || ""));
  });
  document.querySelectorAll("#balance-row button").forEach((b) => {
    b.classList.toggle("on", (b.dataset.balance || "") === (state.balance || ""));
  });
  const names = listPresets()
    .filter((p) => p.id === state.lift || p.id === state.balance)
    .map((p) => p.blurb);
  $("preset-blurb").textContent = names.join(" ");
}

$("lift-row").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-lift]");
  if (!btn) return;
  state.lift = btn.dataset.lift || "";
  markPresets();
  refresh();
});
$("balance-row").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-balance]");
  if (!btn) return;
  state.balance = btn.dataset.balance || "";
  markPresets();
  refresh();
});

function fillEndFromLength(seconds) {
  try {
    const start = parseTime($("cut-start").value || "0");
    $("cut-end").value = formatTime(start + seconds).replace(/s$/, "");
    if (start + seconds >= 60 || start >= 60) {
      const end = start + seconds;
      const m = Math.floor(end / 60);
      const rem = (end % 60).toFixed(2).padStart(5, "0");
      $("cut-end").value = `${m}:${rem}`;
    } else {
      $("cut-end").value = (start + seconds).toFixed(2);
    }
  } catch (err) {
    status(err.message || String(err), true);
  }
}
document.querySelectorAll("[data-len]").forEach((btn) => {
  btn.addEventListener("click", () => fillEndFromLength(Number(btn.dataset.len)));
});

$("cut-add").onclick = () => {
  try {
    const start = parseTime($("cut-start").value);
    const end = parseTime($("cut-end").value);
    if (end <= start) throw new Error("the end time must be after the start");
    state.cuts.push({ start, end });
    renderCuts();
    refresh();
  } catch (err) {
    status(err.message || String(err), true);
  }
};
$("cut-preview").onclick = () => {
  try {
    const start = parseTime($("cut-start").value);
    const end = parseTime($("cut-end").value);
    playRegion(start, end, "cleaned", { cuts: state.cuts.concat([{ start, end }]) });
  } catch (err) {
    status(err.message || String(err), true);
  }
};
$("cut-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.cutDel) {
    state.cuts.splice(Number(btn.dataset.cutDel), 1);
    renderCuts();
    refresh();
  } else if (btn.dataset.cutPlay) {
    const cut = state.cuts[Number(btn.dataset.cutPlay)];
    playRegion(cut.start, cut.end, "cleaned");
  }
});

$("pitch-add").onclick = () => {
  try {
    const start = parseTime($("pitch-start").value);
    const end = parseTime($("pitch-end").value);
    if (end <= start) throw new Error("the end time must be after the start");
    state.pitches.push({
      id: state.pitches.length + 1,
      start,
      end,
      semitones: Number($("pitch-semi").value || 0),
      cents: Number($("pitch-cents").value || 0),
      snap: $("pitch-snap").checked,
    });
    renderPitches();
    refresh();
  } catch (err) {
    status(err.message || String(err), true);
  }
};
$("pitch-preview").onclick = () => {
  try {
    const start = parseTime($("pitch-start").value);
    const end = parseTime($("pitch-end").value);
    const extra = [{
      start,
      end,
      semitones: Number($("pitch-semi").value || 0),
      cents: Number($("pitch-cents").value || 0),
      snap: $("pitch-snap").checked,
    }];
    playRegion(start, end, "cleaned", { pitches: state.pitches.concat(extra) });
  } catch (err) {
    status(err.message || String(err), true);
  }
};
$("pitch-list").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.pitchDel) {
    state.pitches.splice(Number(btn.dataset.pitchDel), 1);
    renderPitches();
    refresh();
  } else if (btn.dataset.pitchPlay) {
    const fix = state.pitches[Number(btn.dataset.pitchPlay)];
    playRegion(fix.start, fix.end, "cleaned");
  }
});

$("polish-preview").onclick = () => {
  if (!state.original) return;
  const duration = state.original.channels[0].length / state.original.sampleRate;
  const start = Math.min(duration * 0.2, Math.max(0, duration - 8));
  const end = Math.min(duration, start + 8);
  playRegion(start, end, "cleaned");
};

function playRegion(start, end, kind, extras) {
  if (!state.original) return;
  const pad = 0.4;
  if (kind === "original") {
    playAudio(state.original, Math.max(0, start - pad), end + pad);
    return;
  }
  const duration = state.original.channels[0].length / state.original.sampleRate;
  const cuts = extras && extras.cuts ? extras.cuts : state.cuts;
  const pitches = extras && extras.pitches ? extras.pitches : state.pitches;
  const spots = attachManualCuts(state.spots, cuts, duration);
  const applied = applyAll(state.original, {
    spots,
    pitchFixes: pitches,
    lift: state.lift || null,
    balance: state.balance || null,
  });
  let shift = 0;
  for (const s of spots) {
    if (s.action !== "keep" && s.end <= start) shift += s.end - s.start;
  }
  const join = Math.max(0, start - shift);
  const clipEnd = Math.max(join + pad, end - shift + pad);
  const snippet = sliceSeconds(applied.audio, Math.max(0, join - pad), clipEnd);
  playAudio(snippet, 0, snippet.channels[0].length / snippet.sampleRate);
}

$("download-report-md").onclick = () => {
  if (!state.report) return;
  const text = formatMarkdown(state.report);
  downloadBlob(new Blob([text], { type: "text/markdown" }), stem() + ".cleaning-report.md");
};
$("download-report-json").onclick = () => {
  if (!state.report) return;
  downloadBlob(
    new Blob([JSON.stringify(state.report, null, 2)], { type: "application/json" }),
    stem() + ".cleaning-report.json"
  );
};
$("download-wav").onclick = () => {
  if (!state.result || !state.result.cleaned) {
    status(NOTHING_FOUND, true);
    return;
  }
  const blob = encodeWav(state.result.cleaned.channels, state.result.cleaned.sampleRate);
  downloadBlob(blob, stem() + ".cleaned.wav");
};

function stem() {
  return (state.name || "song").replace(/\.[^.]+$/, "");
}

export { NOTHING_FOUND, currentSpots };
