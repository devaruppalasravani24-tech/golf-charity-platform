function normaliseNumbers(numbers) {
  return [...new Set((numbers || []).map(Number).filter(Boolean))].sort(
    (left, right) => left - right
  );
}

export function generateRandomNumbers(count = 5, min = 1, max = 49) {
  const generatedNumbers = new Set();

  while (generatedNumbers.size < count) {
    generatedNumbers.add(
      Math.floor(Math.random() * (max - min + 1)) + min
    );
  }

  return [...generatedNumbers].sort((left, right) => left - right);
}

export function generateAlgorithmicNumbers(scores = [], count = 5, max = 49) {
  const safeScores = scores.map((score) => Number(score.score || score)).filter(Boolean);
  const averageScore =
    safeScores.length > 0
      ? safeScores.reduce((total, value) => total + value, 0) / safeScores.length
      : 30;
  const seed = Math.round(averageScore * 100) + safeScores.length * 31;
  const generatedNumbers = new Set();

  while (generatedNumbers.size < count) {
    const index = generatedNumbers.size + 1;
    const value = Math.abs(
      Math.sin(seed * index * 0.17) * 10000 + averageScore * index
    );
    generatedNumbers.add((Math.floor(value) % max) + 1);
  }

  return [...generatedNumbers].sort((left, right) => left - right);
}

export function buildEntryNumbersFromScores(scores = []) {
  return generateAlgorithmicNumbers(scores, 5, 49);
}

export function countMatches(drawnNumbers = [], userNumbers = []) {
  const drawnSet = new Set(normaliseNumbers(drawnNumbers));
  return normaliseNumbers(userNumbers).filter((value) => drawnSet.has(value)).length;
}

export function getMatchedNumbers(drawnNumbers = [], userNumbers = []) {
  const drawnSet = new Set(normaliseNumbers(drawnNumbers));
  return normaliseNumbers(userNumbers).filter((value) => drawnSet.has(value));
}

export function getPrizeTier(matchCount) {
  const tiers = {
    5: {
      badge: "Jackpot",
      colorClassName: "text-gold",
      description: "Five matched numbers",
      share: 40,
    },
    4: {
      badge: "Major",
      colorClassName: "text-accent",
      description: "Four matched numbers",
      share: 35,
    },
    3: {
      badge: "Prize",
      colorClassName: "text-accent2",
      description: "Three matched numbers",
      share: 25,
    },
  };

  return tiers[matchCount] || null;
}

export function calculateWinnerBreakdown(drawnNumbers = [], entries = []) {
  return entries
    .map((entry) => {
      const matchedNumbers = getMatchedNumbers(drawnNumbers, entry.numbers || []);
      const matchCount = matchedNumbers.length;

      return {
        ...entry,
        matchCount,
        matchedNumbers,
        tier: getPrizeTier(matchCount),
      };
    })
    .filter((entry) => entry.matchCount >= 3)
    .sort((left, right) => right.matchCount - left.matchCount);
}
