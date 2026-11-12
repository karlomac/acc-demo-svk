import PocketBase from 'pocketbase'
import { getConfig } from './core/config.ts'

let instance: PocketBase | null = null

export async function getAdminPb(): Promise<PocketBase> {
  if (!instance) {
    instance = new PocketBase(getConfig().POCKETBASE_URL)
    await instance.collection('_superusers').authWithPassword(
      getConfig().PB_SUPERUSER_EMAIL,
      getConfig().PB_SUPERUSER_PASSWORD
    )
  }
  return instance
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
