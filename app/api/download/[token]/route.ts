import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_DOWNLOADS = 5;

function slug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80) || "restaurant";
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  if (!token || !UUID_RE.test(token)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const variantParam = req.nextUrl.searchParams.get("i");
  const variantIndex =
    variantParam !== null ? Math.max(0, parseInt(variantParam, 10) || 0) : 0;

  try {
    const supabase = createServiceRoleClient();
    const { data: row, error } = await supabase
      .from("generations")
      .select("html, paid, download_token_expires_at, download_count, form_data")
      .eq("download_token", token)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!row.paid) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    const expires = row.download_token_expires_at
      ? new Date(row.download_token_expires_at).getTime()
      : 0;
    if (expires && Date.now() > expires) {
      return NextResponse.json({ error: "This download link has expired" }, { status: 410 });
    }

    const count = row.download_count ?? 0;
    if (count >= MAX_DOWNLOADS) {
      return NextResponse.json(
        { error: "Download limit reached — reply to your confirmation email for help" },
        { status: 429 }
      );
    }

    const htmlArr = row.html as string[];
    const formData = row.form_data as { restaurantName?: string };
    const nameSlug = slug(formData?.restaurantName ?? "restaurant");

    if (!htmlArr?.length) {
      return NextResponse.json({ error: "No files" }, { status: 404 });
    }

    const idx = Math.min(variantIndex, htmlArr.length - 1);
    const html = htmlArr[idx];
    if (!html) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error: incError } = await supabase
      .from("generations")
      .update({ download_count: count + 1 })
      .eq("download_token", token);

    if (incError) {
      console.error("[download] increment failed", incError);
    }

    const suffix = htmlArr.length > 1 ? `-direction-${idx + 1}` : "";
    const filename = `${nameSlug}${suffix}.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[download]", e);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
