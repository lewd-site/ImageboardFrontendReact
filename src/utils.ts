const units = ['', 'К', 'М', 'Г', 'Т', 'П'];

export function getFileSizeUnitIndex(value: number, minUnitIndex = 0): number {
  if (value < 1024) {
    return 0;
  }

  return Math.max(minUnitIndex, Math.floor((31 - Math.clz32(value)) / 10));
}

export function formatFileSize(value: number, minUnitIndex = 0): string {
  const unitIndex = getFileSizeUnitIndex(value, minUnitIndex);
  value = value / Math.pow(1024, unitIndex);
  return `${Number(value.toFixed(2))} ${units[unitIndex]}байт`;
}

export function formatUploadProgress(current: number, total: number, minUnitIndex = 0): string {
  const unitIndex = getFileSizeUnitIndex(total, minUnitIndex);
  current = current / Math.pow(1024, unitIndex);
  total = total / Math.pow(1024, unitIndex);
  return `${Number(current.toFixed(2))}/${Number(total.toFixed(2))} ${units[unitIndex]}байт`;
}
