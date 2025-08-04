class SeededRandom {
    /**
     * Creates a new seeded random number generator.
     * @param {number} seed The initial seed, which will be treated as a 32-bit unsigned integer.
     */
    constructor(seed) {
        this.seed = seed >>> 0;
    }

    /**
     * Generates the next pseudo-random float in the sequence.
     * The value is between 0 (inclusive) and 1 (exclusive).
     * This implementation uses the Mulberry32 algorithm.
     * @returns {number} A pseudo-random float.
     */
    next() {
        // Mulberry32 algorithm
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Generates the next pseudo-random integer in a given range.
     * @param {number} min The minimum value (inclusive).
     * @param {number} max The maximum value (exclusive).
     * @returns {number} A pseudo-random integer.
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }
}