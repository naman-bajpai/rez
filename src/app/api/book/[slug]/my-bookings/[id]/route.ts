import { notImplemented } from "../../../../_lib/not-implemented";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ slug: string; id: string }> }
) {
  return notImplemented();
}

export async function PATCH(
  _request: Request,
  _context: { params: Promise<{ slug: string; id: string }> }
) {
  return notImplemented();
}
