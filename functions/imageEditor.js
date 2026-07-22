import sharp from "sharp";

const TARGET_SIZE = 500;

// Scales the image so its short edge is 500 pixels, crops the overflow from
// the center, and reports both edits to the assertion manager.
export async function cropToSquare(originalJpeg, assertionManager) {
  const { width, height } = await sharp(originalJpeg).metadata();

  const croppedJpeg = await sharp(originalJpeg)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover" })
    .jpeg()
    .toBuffer();

  assertionManager.recordResized({ width, height }, TARGET_SIZE);
  assertionManager.recordCropped(TARGET_SIZE);
  return croppedJpeg;
}
