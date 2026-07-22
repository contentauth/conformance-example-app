// Tracks the edits made to an asset and expresses them as C2PA actions.
// The c2pa.opened action is not tracked here: the SDK adds it automatically
// because the manifest is built with the "edit" intent.
export class AssertionManager {
  constructor() {
    this.actions = [];
  }

  recordResized(from, shortEdge) {
    this.actions.push({
      action: "c2pa.resized",
      description: `Scaled the ${from.width}x${from.height} image so its short edge is ${shortEdge} pixels`,
    });
  }

  recordCropped(size) {
    this.actions.push({
      action: "c2pa.cropped",
      description: `Cropped to a centered ${size}x${size} square`,
    });
  }

  toActions() {
    return this.actions;
  }
}
