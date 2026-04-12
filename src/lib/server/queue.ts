/**
 * BullMQ enqueue helpers.
 */
export async function enqueueJob(
  _name: string,
  _payload: Record<string, unknown>
): Promise<void> {
  throw new Error("enqueueJob not implemented");
}
