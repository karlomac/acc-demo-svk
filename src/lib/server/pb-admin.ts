import PocketBase from 'pocketbase'
import { getConfig } from './core/config.ts'

let instancePromise: Promise<PocketBase> | null = null

async function createAdmin(): Promise<PocketBase> {
  const config = getConfig()
  const pb = new PocketBase(config.POCKETBASE_URL)
  // Concurrent server requests must not cancel each other.
  pb.autoCancellation(false)
  await pb.collection('_superusers').authWithPassword(
    config.PB_SUPERUSER_EMAIL,
    config.PB_SUPERUSER_PASSWORD
  )
  return pb
}

export async function getAdminPb(): Promise<PocketBase> {
  if (!instancePromise) {
    instancePromise = createAdmin().catch((err) => {
      instancePromise = null
      throw err
    })
  }
  return instancePromise
}

export async function adminCall<T>(fn: (pb: PocketBase) => Promise<T>): Promise<T> {
  const pb = await getAdminPb()
  try {
    return await fn(pb)
  } catch (err: any) {
    if (err && err.status === 401) {
      await pb.collection('_superusers').authWithPassword(
        getConfig().PB_SUPERUSER_EMAIL,
        getConfig().PB_SUPERUSER_PASSWORD
      )
      return await fn(pb)
    }
    throw err
  }
}
