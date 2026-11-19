/**
 * How many products a comparison holds: a table wider than four stops being readable. Its own module, not the
 * client store's, because the server page reads it too, and a server import from a "use client" module gets a
 * client reference instead of the number.
 */
export const COMPARE_LIMIT = 4;
