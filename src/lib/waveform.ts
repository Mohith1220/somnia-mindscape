/** Deterministic decorative waveform used for ambient background visuals only. */
export function generateWaveform(seed: number, points = 400): number[] {
  const out: number[] = [];
  // simple LCG
  const normalizedSeed = Math.abs(Math.trunc(seed)) % 1_000_000;
  let s = normalizedSeed * 9973 + 12345;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 0xffffffff) * 2 - 1;
  };
  const conditionSeed = seed >= 10 ? Math.abs(seed) % 10 : seed;
  const amp = conditionSeed === 4 ? 60 : conditionSeed === 3 ? 34 : conditionSeed === 2 ? 24 : 14;
  const spike = conditionSeed === 4;
  const disruption = conditionSeed === 3;
  for (let i = 0; i < points; i++) {
    const t = i / points;
    let v =
      Math.sin(t * Math.PI * 20 + seed) * amp * 0.55 +
      Math.sin(t * Math.PI * 60 + seed * 2) * amp * 0.25 +
      Math.sin(t * Math.PI * 8) * amp * 0.35 +
      rnd() * amp * 0.15;
    if (spike && (i % 47 === 0 || i % 53 === 0)) v += rnd() * amp * 1.6;
    if (disruption && i % 68 > 48) v *= 0.38 + Math.abs(rnd()) * 0.24;
    out.push(v);
  }
  return out;
}
