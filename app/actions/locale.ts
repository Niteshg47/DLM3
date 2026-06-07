"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setLocale(locale: "en" | "hi") {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { language: locale },
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/cases");
  revalidatePath("/billing");
  revalidatePath("/analytics");
  revalidatePath("/settings");
  revalidatePath("/doctor/portal");
  revalidatePath("/doctor/submit");
}
