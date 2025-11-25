const store = new Map<string, string>();

export async function kvSet(key: string, value: string) {
  store.set(key, value);
}

export async function kvGet(key: string) {
  return store.get(key) || null;
}

export async function kvDelete(key: string) {
  store.delete(key);
}
