const { ELO_K_FACTOR, ELO_DEFAULT } = require('../config');

/**
 * Calculate new ELO ratings after a match.
 * @param {number} ratingA - Current ELO of player A
 * @param {number} ratingB - Current ELO of player B
 * @param {number} result  - 1 = A wins, 0 = B wins, 0.5 = draw
 * @returns {{ newA: number, newB: number, deltaA: number, deltaB: number }}
 */
function calculate(ratingA, ratingB, result) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const newA = Math.round(ratingA + ELO_K_FACTOR * (result - expectedA));
  const newB = Math.round(ratingB + ELO_K_FACTOR * ((1 - result) - expectedB));

  return {
    newA: Math.max(100, newA),
    newB: Math.max(100, newB),
    deltaA: newA - ratingA,
    deltaB: newB - ratingB,
  };
}

module.exports = { calculate, ELO_DEFAULT };
