const PROFILE_KEY = 'delphi_google_profile';

export type AuthProfile = {
  firstName: string;
  lastName: string;
  /** Full display name (first + last) */
  name: string;
  email: string;
  picture?: string;
};

type GoogleIdClaims = {
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

/** Decode JWT payload with UTF-8 support (atob alone breaks accented names). */
function decodeJwtPayload(credential: string): GoogleIdClaims | null {
  try {
    const payload = credential.split('.')[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleIdClaims;
  } catch {
    return null;
  }
}

/** Decode Google ID token payload (no verify — Instant already validates on sign-in). */
export function decodeGoogleCredential(credential: string): Partial<AuthProfile> {
  const json = decodeJwtPayload(credential);
  if (!json) return {};

  const firstName = (json.given_name || '').trim();
  const lastName = (json.family_name || '').trim();
  const fullFromParts = [firstName, lastName].filter(Boolean).join(' ');
  const name = (json.name || '').trim() || fullFromParts;

  return {
    firstName: firstName || name.split(/\s+/)[0] || '',
    lastName: lastName || name.split(/\s+/).slice(1).join(' ') || '',
    name,
    email: (json.email || '').trim(),
    picture: json.picture || undefined,
  };
}

export function saveGoogleProfile(profile: AuthProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function loadGoogleProfile(): AuthProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthProfile> & { name?: string };
    return normalizeProfile(parsed);
  } catch {
    return null;
  }
}

export function clearGoogleProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

function normalizeProfile(partial: Partial<AuthProfile> & { name?: string }): AuthProfile | null {
  const email = (partial.email || '').trim();
  let firstName = (partial.firstName || '').trim();
  let lastName = (partial.lastName || '').trim();
  let name = (partial.name || '').trim();

  if (!name && (firstName || lastName)) {
    name = [firstName, lastName].filter(Boolean).join(' ');
  }
  if (!firstName && name) {
    const parts = name.split(/\s+/);
    firstName = parts[0] || '';
    if (!lastName) lastName = parts.slice(1).join(' ');
  }
  if (!name) {
    name = nameFromEmail(email);
    firstName = firstName || name;
  }
  if (!email && !name) return null;

  return {
    firstName: firstName || 'Participant',
    lastName,
    name,
    email,
    picture: partial.picture || undefined,
  };
}

/** Persist name / last name / avatar from the Google credential. */
export function captureGoogleCredential(credential: string): AuthProfile {
  const decoded = decodeGoogleCredential(credential);
  const email = (decoded.email || '').trim();
  const fallback = nameFromEmail(email);

  const firstName = decoded.firstName || fallback;
  const lastName = decoded.lastName || '';
  const name =
    decoded.name ||
    [firstName, lastName].filter(Boolean).join(' ') ||
    fallback;

  const profile: AuthProfile = {
    firstName,
    lastName,
    name,
    email,
    picture: decoded.picture,
  };
  saveGoogleProfile(profile);
  return profile;
}

/** Merge Instant user + cached Google profile (avatar lives in the JWT / cache). */
export function profileFromUser(user: { id: string; email?: string | null }): AuthProfile {
  const stored = loadGoogleProfile();
  const email = (user.email || stored?.email || '').trim();

  if (stored && (!email || !stored.email || stored.email === email)) {
    return {
      firstName: stored.firstName,
      lastName: stored.lastName,
      name: stored.name || nameFromEmail(email),
      email: email || stored.email,
      picture: stored.picture,
    };
  }

  const name = nameFromEmail(email);
  return {
    firstName: name,
    lastName: '',
    name,
    email,
  };
}

function nameFromEmail(email: string): string {
  if (!email) return 'Participant';
  const local = email.split('@')[0] || 'Participant';
  return (
    local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Participant'
  );
}
