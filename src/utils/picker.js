const pending = new Map(); // token -> { userId, resolve, reject, timeout }

export function createPicker(token, userId, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    if (pending.has(token)) return reject(new Error('Token già esistente'));

    const timeout = setTimeout(() => {
      if (pending.has(token)) {
        pending.get(token).reject(new Error('timeout'));
        pending.delete(token);
      }
    }, timeoutMs);

    pending.set(token, { userId, resolve, reject, timeout });
  });
}

export function resolvePicker(token, selection) {
  const entry = pending.get(token);
  if (!entry) return false;
  clearTimeout(entry.timeout);
  try {
    entry.resolve(selection);
  } catch (err) {
    entry.reject(err);
  }
  pending.delete(token);
  return true;
}

export function cancelPicker(token) {
  const entry = pending.get(token);
  if (!entry) return false;
  clearTimeout(entry.timeout);
  entry.reject(new Error('cancelled'));
  pending.delete(token);
  return true;
}

export function hasPicker(token) {
  return pending.has(token);
}

export default pending;
