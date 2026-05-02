import { getPublicBaseUrl, getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import SuccessContent from "./SuccessContent";
import { C } from "@/lib/tokens";

function Shell({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        backgroundColor: C.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.text,
        fontFamily: "'Crimson Pro', Georgia, serif",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <h1 className="cg" style={{ fontSize: "26px", fontStyle: "italic", marginBottom: "10px" }}>
          {title}
        </h1>
        <p className="cp" style={{ color: C.muted, fontSize: "16px", lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id?.trim()) {
    return (
      <Shell
        title="Missing session"
        subtitle="Open the link from your Stripe receipt, or return to your preview to try again."
      />
    );
  }

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id.trim());
  } catch {
    return <Shell title="Invalid session" subtitle="This payment link is not valid or has expired." />;
  }

  if (session.payment_status !== "paid") {
    return (
      <Shell
        title="Payment not completed"
        subtitle="If you cancelled checkout, you can return to your preview to try again."
      />
    );
  }

  const generationId = session.metadata?.generation_id?.trim();
  if (!generationId) {
    return <Shell title="Something went wrong" subtitle="Missing order details. Please contact support with your receipt." />;
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return <Shell title="Configuration error" subtitle="Server could not load your order. Please try again shortly." />;
  }

  const { data: gen } = await supabase
    .from("generations")
    .select("paid, download_token, html")
    .eq("id", generationId)
    .maybeSingle();

  const htmlArr = gen?.html;
  const variantCount = Array.isArray(htmlArr) ? htmlArr.length : 0;
  const initialReady = Boolean(gen?.paid && gen?.download_token);
  const token = typeof gen?.download_token === "string" ? gen.download_token : null;
  const baseUrl = getPublicBaseUrl();

  return (
    <SuccessContent
      generationId={generationId}
      initialReady={initialReady}
      downloadToken={token}
      baseUrl={baseUrl}
      variantCount={variantCount}
    />
  );
}
