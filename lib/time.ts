export function parseFlexibleTimeToSeconds(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) throw new Error("Invalid time");
    return Math.floor(input);
  }

  const raw = input.trim();
  if (!raw) throw new Error("Time is required");

  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  const parts = raw.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) {
    throw new Error("Invalid time format");
  }

  if (parts.length === 2) {
    const [mm, ss] = parts.map(Number);
    return mm * 60 + ss;
  }

  if (parts.length === 3) {
    const [hh, mm, ss] = parts.map(Number);
    return hh * 3600 + mm * 60 + ss;
  }

  throw new Error("Invalid time format");
}
