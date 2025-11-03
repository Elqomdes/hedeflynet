import mongoose from 'mongoose';

/**
 * Safely converts an _id field to a string
 * Handles ObjectId, string, and other types
 */
export function safeIdToString(id: any): string {
  if (!id) {
    throw new Error('ID is missing');
  }
  if (typeof id === 'string') {
    return id;
  }
  if (id instanceof mongoose.Types.ObjectId) {
    return id.toString();
  }
  if (id.toString && typeof id.toString === 'function') {
    return id.toString();
  }
  return String(id);
}

/**
 * Safely converts an _id field to a string, returns null if missing
 */
export function safeIdToStringOrNull(id: any): string | null {
  if (!id) {
    return null;
  }
  try {
    return safeIdToString(id);
  } catch {
    return null;
  }
}

