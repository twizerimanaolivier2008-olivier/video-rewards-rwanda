export const getWindowStart = (nowMs, windowSeconds) => {
  if (!Number.isFinite(nowMs) || nowMs < 0 ||
      !Number.isInteger(windowSeconds) || windowSeconds < 1) {
    throw new TypeError('A non-negative timestamp and positive integer window are required.');
  }
  return Math.floor(nowMs / (windowSeconds * 1000)) * windowSeconds;
};
