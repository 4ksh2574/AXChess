/// <reference lib="webworker" />
import { pickMove, type Request, type Reply } from "./engine-core";

self.onmessage = (event: MessageEvent<Request & { id: number }>) => {
  const { id, ...req } = event.data;
  let move: Reply = null;
  try {
    move = pickMove(req);
  } catch {
    move = null;
  }
  (self as unknown as Worker).postMessage({ id, move });
};
