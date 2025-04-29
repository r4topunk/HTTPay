/**
 * Common types used by contracts
 */

/**
 * Uint128 represents a 128-bit unsigned integer with string serialization.
 * 
 * Since JavaScript doesn't support native 128-bit integers, we use strings to
 * preserve precision.
 */
export type Uint128 = string;
