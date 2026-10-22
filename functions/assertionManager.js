// Tracks the edits made to an asset and expresses them as C2PA actions.
// The c2pa.opened action is not tracked here: the SDK adds it automatically
// because the manifest is built with the "edit" intent (and conformance
// prohibits a digitalSourceType on c2pa.opened).

// Conformance requires a digitalSourceType on perceptible transformations.
// These edits are requested by a person and made with non-generative tools.
const HUMAN_EDITS = "http://cv.iptc.org/newscodes/digitalsourcetype/humanEdits";

export class AssertionManager {
  constructor() {
    this.actions = [];
  }

  recordResized(from, shortEdge) {
    this.actions.push({
      action: "c2pa.resized",
      digitalSourceType: HUMAN_EDITS,
      description: `Scaled the ${from.width}x${from.height} image so its short edge is ${shortEdge} pixels`,
    });
  }

  recordCropped(size) {
    this.actions.push({
      action: "c2pa.cropped",
      digitalSourceType: HUMAN_EDITS,
      description: `Cropped to a centered ${size}x${size} square`,
    });
  }

  toActions() {
    return this.actions;
  }
}
