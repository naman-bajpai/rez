import { notImplemented } from "../../_lib/not-implemented";

/** GET, PATCH */
export async function GET(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return notImplemented();
}

export async function PATCH(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  return notImplemented();
}
