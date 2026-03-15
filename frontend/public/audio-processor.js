/**
 * AudioWorklet processor for capturing PCM16 audio at 16kHz.
 * Replaces the deprecated ScriptProcessorNode.
 */
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._sampleCount = 0;
    this._chunkSize = 4096;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];
    for (let i = 0; i < samples.length; i++) {
      this._buffer.push(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))));
      this._sampleCount++;
    }

    if (this._sampleCount >= this._chunkSize) {
      const pcm16 = new Int16Array(this._buffer);
      this.port.postMessage({ type: "pcm", data: pcm16.buffer }, [pcm16.buffer]);
      this._buffer = [];
      this._sampleCount = 0;
    }

    return true;
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
