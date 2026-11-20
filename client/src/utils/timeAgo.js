import { pluralWord } from "./pluralize";

const formatUnit = (value, unit) => `${value} ${unit}`;

const timeAgo = (dateValue) => {
  if (!dateValue) {
    return "just now";
  }

  const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);

  if (seconds < 60) {
    return formatUnit(Math.max(seconds, 1), "sec");
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return formatUnit(minutes, "min");
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return formatUnit(hours, "h");
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return formatUnit(days, "d");
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${weeks} ${pluralWord(weeks, "week")}`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} ${pluralWord(months, "month")}`;
  }

  const years = Math.max(Math.floor(days / 365), 1);

  return `${years} ${pluralWord(years, "year")}`;
};

export default timeAgo;