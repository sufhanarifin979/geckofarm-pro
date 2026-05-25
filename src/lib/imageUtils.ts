
export const autoCropToSquare = async (base64Str: string, size = 512): Promise<string> => {
  console.log('[DEBUG] autoCropToSquare (base64 mode) start', { size });
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      
      canvas.width = size;
      canvas.height = size;
      
      ctx?.drawImage(
        img,
        sx, sy, minDim, minDim, // Source
        0, 0, size, size // Destination
      );
      
      const result = canvas.toDataURL('image/jpeg', 0.8);
      console.log('[DEBUG] autoCropToSquare end', { resultLength: result.length });
      resolve(result);
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const compressImage = async (base64Str: string, maxWidth = 512, maxHeight = 512): Promise<string> => {
  console.log('[DEBUG] compressImage (base64 mode) start', { maxWidth, maxHeight });
  if (!base64Str || !base64Str.startsWith('data:image')) return base64Str;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use 0.75 quality for better balance
      const result = canvas.toDataURL('image/jpeg', 0.75);
      console.log('[DEBUG] compressImage end', { resultLength: result.length, width, height });
      resolve(result);
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const uploadGeckoImage = async (
  userId: string, 
  geckoId: string, 
  base64Str: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('[DEBUG] uploadGeckoImage (base64 mode) started');
  // Just return compressed base64 directly
  if (onProgress) onProgress(50);
  const result = await compressImage(base64Str, 512, 512);
  if (onProgress) onProgress(100);
  return result;
};

export const deleteGeckoImage = async (userId: string, geckoId: string) => {
  // No-op for base64 storage since it's in Firestore
  console.log('[DEBUG] deleteGeckoImage (base64 mode) no-op');
};

export const uploadFarmImage = async (userId: string, base64Str: string): Promise<string> => {
  console.log('[DEBUG] uploadFarmImage (base64 mode) started');
  return await compressImage(base64Str, 512, 512);
};
