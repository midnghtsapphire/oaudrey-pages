/**
 * Radix-2 complex FFT and helpers. No third-party code.
 * Detection frames are rounded up to a power of two, which is a documented
 * gap versus the Python tool's exact 40 ms frame size.
 */
export function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

export function fft(re, im) {
  const n = re.length;
  if (n !== im.length || n < 1 || (n & (n - 1)) !== 0) {
    throw new Error("fft length must be a power of two");
  }
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j += 1) {
        const ur = re[i + j];
        const ui = im[i + j];
        const vr = re[i + j + half] * wRe - im[i + j + half] * wIm;
        const vi = re[i + j + half] * wIm + im[i + j + half] * wRe;
        re[i + j] = ur + vr;
        im[i + j] = ui + vi;
        re[i + j + half] = ur - vr;
        im[i + j + half] = ui - vi;
        const nRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nRe;
      }
    }
  }
}

export function ifft(re, im) {
  for (let i = 0; i < im.length; i += 1) im[i] = -im[i];
  fft(re, im);
  const n = re.length;
  for (let i = 0; i < n; i += 1) {
    re[i] /= n;
    im[i] = -im[i] / n;
  }
}

export function rfftMag(frame) {
  const n = frame.length;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  re.set(frame);
  fft(re, im);
  const half = (n >> 1) + 1;
  const mag = new Float32Array(half);
  for (let i = 0; i < half; i += 1) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

export function hann(n) {
  const w = new Float32Array(n);
  if (n === 1) {
    w[0] = 1;
    return w;
  }
  for (let i = 0; i < n; i += 1) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}
