export type FilterType = 'normal' | 'warm' | 'cool' | 'blackwhite' | 'softglow' | 'contrast';

export const applyFilter = (canvas: HTMLCanvasElement, filter: FilterType): void => {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  switch (filter) {
    case 'warm':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.min(255, data[i + 2] * 0.9);
      }
      break;

    case 'cool':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 0.9);
        data[i + 1] = Math.min(255, data[i + 1] * 1.05);
        data[i + 2] = Math.min(255, data[i + 2] * 1.1);
      }
      break;

    case 'blackwhite':
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      break;

    case 'softglow':
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.15);
        data[i + 1] = Math.min(255, data[i + 1] * 1.15);
        data[i + 2] = Math.min(255, data[i + 2] * 1.15);
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] * 0.7 + avg * 0.3;
        data[i + 1] = data[i + 1] * 0.7 + avg * 0.3;
        data[i + 2] = data[i + 2] * 0.7 + avg * 0.3;
      }
      break;

    case 'contrast': {
      const factor = 1.5;
      const intercept = 128 * (1 - factor);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
      }
      break;
    }

    case 'normal':
    default:
      return;
  }

  ctx.putImageData(imageData, 0, 0);
};
