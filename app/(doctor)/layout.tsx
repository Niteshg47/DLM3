import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { DoctorShell } from "@/components/doctor/doctor-shell";
import { Providers } from "@/app/providers";

export const dynamic = "force-dynamic";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  let tenant;
  try {
    tenant = await getTenantFromRequest();
  } catch (err) {
    console.error("[DoctorLayout] getTenantFromRequest failed:", err);
    redirect("/login");
  }

  if (tenant.id !== session.user.tenantId) {
    redirect("/login");
  }

  return (
    <Providers>
      <DoctorShell
        tenant={tenant}
        userName={session.user.name ?? session.user.email}
        userId={session.user.id}
      >
        {children}
      </DoctorShell>
    </Providers>
  );
}
