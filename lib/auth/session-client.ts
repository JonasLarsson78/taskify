type VerifySessionResult<UserShape> =
  | { ok: true; user: UserShape }
  | { ok: false; status: number; error: string }

type CachedEntry = {
  user: unknown
  at: number
}

const VERIFY_CACHE_TTL_MS = 60_000
const verifiedSessionCache = new Map<string, CachedEntry>()
const inFlightVerifications = new Map<
  string,
  Promise<VerifySessionResult<unknown>>
>()

function isCachedEntryFresh(entry: CachedEntry) {
  return Date.now() - entry.at < VERIFY_CACHE_TTL_MS
}

export function clearVerifiedSessionCache(token?: string) {
  if (token) {
    verifiedSessionCache.delete(token)
    inFlightVerifications.delete(token)
    return
  }

  verifiedSessionCache.clear()
  inFlightVerifications.clear()
}

async function verifyViaApi(
  token: string
): Promise<VerifySessionResult<unknown>> {
  const response = await fetch('/api/verify', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    return {
      ok: false,
      status: response.status,
      error:
        data && typeof data === 'object' && 'error' in data
          ? String(data.error)
          : 'Verification failed',
    }
  }

  const verifyData = await response.json().catch(() => null)
  const verifiedUser =
    verifyData && typeof verifyData === 'object' && 'user' in verifyData
      ? (verifyData.user as unknown)
      : null

  if (!verifiedUser || typeof verifiedUser !== 'object') {
    return {
      ok: false,
      status: 500,
      error: 'Verification response did not include a user',
    }
  }

  verifiedSessionCache.set(token, { user: verifiedUser, at: Date.now() })
  return { ok: true, user: verifiedUser }
}

export async function verifySessionCached<UserShape>(
  token: string,
  options?: { force?: boolean }
): Promise<VerifySessionResult<UserShape>> {
  const force = Boolean(options?.force)

  if (!force) {
    const cached = verifiedSessionCache.get(token)
    if (cached && isCachedEntryFresh(cached)) {
      return { ok: true, user: cached.user as UserShape }
    }
  }

  const currentInFlight = inFlightVerifications.get(token)
  if (currentInFlight) {
    return currentInFlight as Promise<VerifySessionResult<UserShape>>
  }

  const requestPromise = verifyViaApi(token)
    .catch((error) => ({
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'Verification failed',
    }))
    .finally(() => {
      inFlightVerifications.delete(token)
    })

  inFlightVerifications.set(token, requestPromise)

  const result = await requestPromise
  return result as VerifySessionResult<UserShape>
}
