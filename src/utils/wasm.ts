/**
 * Feature detection for WebAssembly threads support.
 * Based on Google's implementation for Stockfish WASM.
 */
export function wasmThreadsSupported(): boolean {
    // WebAssembly 1.0
    const source = Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
    if (
        typeof WebAssembly !== "object" ||
        typeof WebAssembly.validate !== "function"
    )
        return false;

    if (!WebAssembly.validate(source)) return false;

    // SharedArrayBuffer
    if (typeof SharedArrayBuffer !== "function") return false;

    // Atomics
    if (typeof Atomics !== "object") return false;

    // Shared memory
    const mem = new WebAssembly.Memory({ shared: true, initial: 8, maximum: 16 });
    if (!(mem.buffer instanceof SharedArrayBuffer)) return false;

    // Structured cloning
    try {
        // We use a small hack to check if postMessage can handle the memory object
        // In a browser environment, we can check for postMessage existence
        if (typeof window !== 'undefined') {
            // Just checking if we can send it
            // Note: Actual postMessage might trigger unintended side effects if not careful,
            // but this is the standard check for structured cloning of WASM memory.
            try {
                const channel = new MessageChannel();
                channel.port1.postMessage(mem);
            } catch (e) {
                return false;
            }
        }
    } catch (e) {
        return false;
    }

    // Growable shared memory
    try {
        mem.grow(8);
    } catch (e) {
        return false;
    }

    return true;
}
