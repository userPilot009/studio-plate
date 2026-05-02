import { notFound } from "next/navigation";
import PreviewFrame from "@/components/PreviewFrame";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FormData, Tier } from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    notFound();
  }

  const { data, error } = await supabase
    .from("generations")
    .select("form_data, html, tier")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const html = data.html as string[] | null;
  if (!html?.length) notFound();

  const formData = data.form_data as FormData;
  const tier = data.tier as Tier;

  return (
    <PreviewFrame
      htmlPages={html}
      restaurantName={formData.restaurantName}
      generationId={id}
      tier={tier}
    />
  );
}
