import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { LabShell } from "@/components/lab/lab-shell";
import { Providers } from "@/app/providers";

export const dynamic = "force-dynamic";

export default async function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "DOCTOR") {
    redirect("/doctor/portal");
  }

  let tenant;
  try {
    tenant = await getTenantFromRequest();
  } catch (err) {
    console.error("[LabLayout] getTenantFromRequest failed:", err);
    redirect("/login");
  }

  if (tenant.id !== session.user.tenantId) {
    redirect("/login");
  }

  return (
    <Providers>
      <LabShell
        tenant={tenant}
        userName={session.user.name ?? session.user.email}
        userId={session.user.id}
        userRole={session.user.role}
      >
        {children}
      </LabShell>
    </Providers>
  );
}
