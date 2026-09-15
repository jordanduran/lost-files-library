const INTRO_SEEN_KEY = "lost-files-home-intro-seen";

export function homeIntroSeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markHomeIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
  } catch {
    // Navigation must still work when browser storage is unavailable.
  }
}
