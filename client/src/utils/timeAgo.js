const pluralize = (value, unit) => {
  if (value === 1) {
    return `1 ${unit}`;
  }

  return `${value} ${unit}`;
};

const timeAgo = (dateValue) => {
  if (!dateValue) {
    return "just now";
  }

  const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);

  if (seconds < 60) {
    return pluralize(Math.max(seconds, 1), "sec");
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return pluralize(minutes, "min");
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return pluralize(hours, "h");
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return pluralize(days, "d");
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return pluralize(weeks, "week");
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return pluralize(months, "month");
  }

  const years = Math.floor(days / 365);

  return pluralize(years, "year");
};

export default timeAgo;