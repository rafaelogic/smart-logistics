import type { AuthUser, UserProfile } from "../types/logistics";

export const profileKey = "smart.userProfile";

export function defaultProfile(user?: AuthUser | null): UserProfile {
  const username = user?.username || "operator";

  return {
    displayName: username,
    email: `${username}@smart-logistics.local`,
    avatarUrl: ""
  };
}

export function loadProfile(user?: AuthUser | null): UserProfile {
  const fallback = defaultProfile(user);
  const stored = localStorage.getItem(profileKey);
  if (!stored) {
    return fallback;
  }

  try {
    return { ...fallback, ...JSON.parse(stored) } as UserProfile;
  } catch {
    return fallback;
  }
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function initialsFor(profile: UserProfile, user?: AuthUser | null) {
  const source = profile.displayName || user?.username || "User";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}
