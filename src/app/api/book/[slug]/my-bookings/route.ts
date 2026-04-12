import { notImplemented } from "../../../_lib/not-implemented";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ slug: string }> }
) {
  return notImplemented();
}
