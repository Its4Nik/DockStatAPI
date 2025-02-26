import type { Readable } from "stream";
import type internal from "stream";

interface streams {
  statsStream: Readable;
  splitStream: internal.Transform;
}

export { streams };
