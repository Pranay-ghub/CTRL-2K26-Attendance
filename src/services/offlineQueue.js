/**
 * Offline Sync Queue Manager
 * Persists unsynced scans in localStorage and coordinates syncing when connectivity resumes.
 */

const STORAGE_KEY = 'ctrl_2k26_offline_queue';

class OfflineQueue {
  constructor() {
    this.listeners = new Set();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.notify();
        }
      });
    }
  }

  getItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read offline queue from localStorage', e);
      return [];
    }
  }

  saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      this.notify();
    } catch (e) {
      console.error('Failed to save offline queue to localStorage', e);
    }
  }

  enqueue(item) {
    const items = this.getItems();
    // Avoid exact duplicate queued items
    const exists = items.some(i => i.id === item.id);
    if (!exists) {
      items.push({
        ...item,
        queuedAt: new Date().toISOString()
      });
      this.saveItems(items);
    }
    return items.length;
  }

  dequeue() {
    const items = this.getItems();
    if (items.length === 0) return null;
    const item = items.shift();
    this.saveItems(items);
    return item;
  }

  remove(id) {
    const items = this.getItems().filter(item => item.id !== id);
    this.saveItems(items);
  }

  clear() {
    this.saveItems([]);
  }

  count() {
    return this.getItems().length;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const currentCount = this.count();
    this.listeners.forEach(listener => {
      try {
        listener(currentCount);
      } catch (err) {
        console.error('Queue listener error', err);
      }
    });
  }
}

export const offlineQueue = new OfflineQueue();
