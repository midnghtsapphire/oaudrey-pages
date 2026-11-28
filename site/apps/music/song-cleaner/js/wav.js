/** Encode a 16-bit PCM WAV. The original file is never touched. */

function writeText(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

export function encodeWav(channels, sampleRate) {
  const nCh = channels.length;
  const length = channels[0].length;
  const bytesPerSample = 2;
  const dataBytes = length * nCh * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buf);
  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeText(view, 8, "WAVE");
  writeText(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, nCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * nCh * bytesPerSample, true);
  view.setUint16(32, nCh * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, dataBytes, true);
  let off = 44;
  for (let i = 0; i < length; i += 1) {
    for (let c = 0; c < nCh; c += 1) {
      let s = channels[c][i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      view.setInt16(off, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true);
      off += 2;
    }
  }
  return new Blob([buf], { type: "audio/wav" });
}

export function toMono(channels) {
  if (channels.length === 1) return channels[0];
  const n = channels[0].length;
  const out = new Float32Array(n);
  const inv = 1 / channels.length;
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    for (let c = 0; c < channels.length; c += 1) sum += channels[c][i];
    out[i] = sum * inv;
  }
  return out;
}

export function cloneChannels(channels) {
  return channels.map((ch) => new Float32Array(ch));
}

export function audioFromBuffer(buffer) {
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c += 1) {
    const src = buffer.getChannelData(c);
    channels.push(new Float32Array(src));
  }
  return { sampleRate: buffer.sampleRate, channels };
}
