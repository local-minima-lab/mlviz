declare module 'canvas-record' {
  export interface RecorderOptions {
    frameRate?: number;
    extension?: string;
    filename?: string;
    download?: boolean;
    duration?: number;
    target?: 'in-browser' | 'file-system';
    quality?: number;
  }

  export class Recorder {
    constructor(context: CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext, options?: RecorderOptions);
    start(): Promise<void>;
    step(): void;
    stop(): Promise<ArrayBuffer | Uint8Array | Blob | Blob[] | any>;
  }
}