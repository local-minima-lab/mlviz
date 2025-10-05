declare module 'dom-to-image-more' {
  export interface Options {
    filter?: (node: Element) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    quality?: number;
    scale?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toPng(node: Element, options?: Options): Promise<string>;
  export function toJpeg(node: Element, options?: Options): Promise<string>;
  export function toSvg(node: Element, options?: Options): Promise<string>;
  export function toPixelData(node: Element, options?: Options): Promise<Uint8ClampedArray>;
  export function toCanvas(node: Element, options?: Options): Promise<HTMLCanvasElement>;
  export function toBlob(node: Element, options?: Options): Promise<Blob>;

  const domtoimage: {
    toPng: typeof toPng;
    toJpeg: typeof toJpeg;
    toSvg: typeof toSvg;
    toPixelData: typeof toPixelData;
    toCanvas: typeof toCanvas;
    toBlob: typeof toBlob;
  };

  export default domtoimage;
}