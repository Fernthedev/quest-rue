let decoderError = false;
let wroteSps = false;
let spsPacket: Uint8Array | undefined;
let canvasContext: OffscreenCanvasRenderingContext2D | undefined;
let decoder: VideoDecoder | undefined;

const isChrome = /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());

const config: VideoDecoderConfig = {
  codec: "avc1.42000a",
  codedWidth: 1080,
  codedHeight: 720,
  optimizeForLatency: true,
  hardwareAcceleration: "prefer-software",
};

const init: VideoDecoderInit = {
  output: (frame) => {
    canvasContext?.drawImage(frame, 0, 0);
    frame.close();
  },
  error: (error) => {
    console.error("decoder error", error);
    decoderError = true;
  },
};

VideoDecoder.isConfigSupported(config).then((support) => {
  if (!support.supported) {
    console.error("config unsupported!", support);
    return;
  }
  decoder = new VideoDecoder(init);
  decoder.configure(config);
});

self.onmessage = (event: MessageEvent) => {
  const data = event.data as
    | { type: "context"; val: OffscreenCanvas }
    | { type: "data"; val: Uint8Array };

  if (data.type === "context") canvasContext = data.val.getContext("2d")!;
  else {
    try {
      if (decoder === undefined || decoderError) return;
      let array = data.val;
      if (array[0] !== 0 || array[1] !== 0 || array[2] !== 0 || array[3] !== 1)
        console.warn("invalid header", array);
      // firefox takes sps as a separate packet, chrome wants it stuck together with a keyframe
      if (isChrome && array[4] === 103) {
        spsPacket = new Uint8Array(array);
        return;
      }
      if (decoder.decodeQueueSize < 5) {
        if (spsPacket !== undefined && !wroteSps && array[4] === 101) {
          console.log("combining sps with normal packet");
          array = new Uint8Array([...spsPacket!, ...array]);
          wroteSps = true;
        }
        const chunk = new EncodedVideoChunk({
          data: array,
          timestamp: 0,
          type: (array[4] === 101 || array[4] === 103) ? "key" : "delta",
        });
        decoder.decode(chunk);
      } else console.log("skipping chunk!");
    } catch (error) {
      console.error("decoding error", error);
    }
  }
};
