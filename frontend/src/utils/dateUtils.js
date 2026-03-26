export function formatDate(value, locale = "en-GB") {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(value, locale = "en-GB") {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  });
}

export function formatDateShort(value, locale = "en-GB") {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

export function formatCurrency(amount, currency = "GBP", locale = "en-GB") {
  const numericAmount = Number(amount || 0);

  return new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(numericAmount);
}

export function timeAgo(value) {
  if (!value) {
    return "just now";
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  }

  if (hours > 0) {
    return `${hours}h ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return "just now";
}

export function daysUntil(value) {
  if (!value) {
    return null;
  }

  const diff = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function getCurrentMonthWindow() {
  const currentDate = new Date();
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  return {
    end: end.toISOString(),
    start: start.toISOString(),
  };
}

export function getMonthLabel(value, locale = "en-GB") {
  if (!value) {
    return "Current month";
  }

  return new Date(value).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}
