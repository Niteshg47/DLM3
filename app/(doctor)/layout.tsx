import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTenantFromRequest } from "@/lib/tenant-context";
import { DoctorShell } from "@/components/doctor/doctor-shell";
import { Providers } from "@/app/providers";

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

  const tenant = await getTenantFromRequest();

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
