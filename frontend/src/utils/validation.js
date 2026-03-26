const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return emailPattern.test(String(email || "").trim());
}

export function isStrongPassword(password) {
  return String(password || "").trim().length >= 8;
}

export function isValidStablefordScore(score) {
  const value = Number(score);
  return Number.isInteger(value) && value >= 1 && value <= 45;
}

export function validateLoginForm(form) {
  if (!isValidEmail(form.email)) {
    return "Enter a valid email address.";
  }

  if (!form.password) {
    return "Enter your password.";
  }

  return "";
}

export function validateSignupForm(form) {
  if (!String(form.fullName || "").trim()) {
    return "Enter your full name.";
  }

  if (!isValidEmail(form.email)) {
    return "Enter a valid email address.";
  }

  if (!isStrongPassword(form.password)) {
    return "Password must be at least 8 characters long.";
  }

  if (form.password !== form.confirmPassword) {
    return "Password confirmation does not match.";
  }

  return "";
}

export function validateScoreEntry(form) {
  if (!isValidStablefordScore(form.score)) {
    return "Stableford scores must be a whole number between 1 and 45.";
  }

  if (!form.playedAt) {
    return "Choose the date the round was played.";
  }

  if (Number.isNaN(new Date(form.playedAt).getTime())) {
    return "Enter a valid played date.";
  }

  return "";
}
