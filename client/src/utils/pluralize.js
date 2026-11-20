// Words that read the same for any count ("1 following", "5 following").
const INVARIANT_WORDS = new Set(["following"]);

// pluralWord(1, "post") → "post", pluralWord(0, "post") → "posts"
export const pluralWord = (count, word) => {
  if (INVARIANT_WORDS.has(word)) {
    return word;
  }

  return Number(count) === 1 ? word : `${word}s`;
};

// pluralize(1, "post") → "1 post", pluralize(2, "post") → "2 posts"
export const pluralize = (count, word) =>
  `${count} ${pluralWord(count, word)}`;

export default pluralize;
