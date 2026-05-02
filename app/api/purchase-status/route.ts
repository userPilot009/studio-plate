import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Poll whether webhook has marked the generation paid and issued a download token. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("generationId")?.trim();
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid generation id" }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("generations")
      .select("paid, download_token")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ready: false, paid: false });
    }

    const ready = Boolean(data.paid && data.download_token);
    return NextResponse.json({
      ready,
      paid: Boolean(data.paid),
      /** Present only when `ready` — used by the success page to build download links after the webhook runs. */
      downloadToken: ready ? data.download_token : null,
    });
  } catch {
    return NextResponse.json({ ready: false, paid: false }, { status: 500 });
  }
}
