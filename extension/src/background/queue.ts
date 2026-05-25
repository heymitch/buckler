const QUEUE_KEY = 'insight_queue';
const MAX_RETRIES = 5;

export interface QueueItem {
  id: string;
  payload: unknown;
  attempts: number;
  next_retry_at: number;
}

export async function enqueue(item: Omit<QueueItem, 'attempts' | 'next_retry_at'>): Promise<void> {
  const storage = await chrome.storage.local.get(QUEUE_KEY);
  const queue: QueueItem[] = storage[QUEUE_KEY] ?? [];
  queue.push({ ...item, attempts: 0, next_retry_at: Date.now() });
  await chrome.storage.local.set({ [QUEUE_KEY]: queue });
}

export async function dequeue(): Promise<QueueItem[]> {
  const storage = await chrome.storage.local.get(QUEUE_KEY);
  const queue: QueueItem[] = storage[QUEUE_KEY] ?? [];
  const now = Date.now();
  return queue.filter(item => item.next_retry_at <= now && item.attempts < MAX_RETRIES);
}

export async function markSuccess(id: string): Promise<void> {
  const storage = await chrome.storage.local.get(QUEUE_KEY);
  const queue: QueueItem[] = storage[QUEUE_KEY] ?? [];
  await chrome.storage.local.set({ [QUEUE_KEY]: queue.filter(item => item.id !== id) });
}

export async function markFailure(id: string): Promise<void> {
  const storage = await chrome.storage.local.get(QUEUE_KEY);
  const queue: QueueItem[] = storage[QUEUE_KEY] ?? [];
  const updated = queue.map(item => {
    if (item.id !== id) return item;
    const attempts = item.attempts + 1;
    const backoff = Math.min(1000 * 60 * Math.pow(2, attempts), 1000 * 60 * 60); // max 1hr
    return { ...item, attempts, next_retry_at: Date.now() + backoff };
  });
  await chrome.storage.local.set({ [QUEUE_KEY]: updated });
}

export async function queueSize(): Promise<number> {
  const storage = await chrome.storage.local.get(QUEUE_KEY);
  const queue: QueueItem[] = storage[QUEUE_KEY] ?? [];
  return queue.length;
}
