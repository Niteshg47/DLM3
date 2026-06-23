"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const MAX_STAFF_PER_TENANT = 3;

async function checkAdminAccess(tenantId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.tenantId !== tenantId || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized: Only admins can manage staff");
  }

  return session.user.id;
}

export async function getStaffList(tenantId: string) {
  await checkAdminAccess(tenantId);

  const staff = await prisma.user.findMany({
    where: {
      tenantId,
      role: "LAB_STAFF",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return staff;
}

export async function getStaffCount(tenantId: string) {
  const count = await prisma.user.count({
    where: {
      tenantId,
      role: "LAB_STAFF",
    },
  });

  return count;
}

export async function createStaff(
  tenantId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    await checkAdminAccess(tenantId);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return { error: "All fields are required" };
    }

    // Check staff limit
    const currentCount = await getStaffCount(tenantId);
    if (currentCount >= MAX_STAFF_PER_TENANT) {
      return { error: `Maximum ${MAX_STAFF_PER_TENANT} staff accounts allowed` };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase(),
        },
      },
    });

    if (existingUser) {
      return { error: "A user with this email already exists" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create staff user
    await prisma.user.create({
      data: {
        tenantId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "LAB_STAFF",
        active: true,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error creating staff:", error);
    return { error: "Failed to create staff account" };
  }
}

export async function updateStaff(
  tenantId: string,
  staffId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    await checkAdminAccess(tenantId);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const active = formData.get("active") === "true";

    if (!name || !email) {
      return { error: "Name and email are required" };
    }

    // Verify staff belongs to tenant
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        tenantId,
        role: "LAB_STAFF",
      },
    });

    if (!staff) {
      return { error: "Staff not found" };
    }

    // Check if email is being changed and if new email already exists
    if (email.toLowerCase() !== staff.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email: email.toLowerCase(),
          },
        },
      });

      if (existingUser) {
        return { error: "A user with this email already exists" };
      }
    }

    // Build update data
    const updateData: any = {
      name,
      email: email.toLowerCase(),
      active,
    };

    // Update password only if provided
    if (password && password.length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: staffId },
      data: updateData,
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating staff:", error);
    return { error: "Failed to update staff account" };
  }
}

export async function deleteStaff(
  tenantId: string,
  staffId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await checkAdminAccess(tenantId);

    // Verify staff belongs to tenant
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        tenantId,
        role: "LAB_STAFF",
      },
    });

    if (!staff) {
      return { error: "Staff not found" };
    }

    await prisma.user.delete({
      where: { id: staffId },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting staff:", error);
    return { error: "Failed to delete staff account" };
  }
}

export async function toggleStaffActive(
  tenantId: string,
  staffId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await checkAdminAccess(tenantId);

    // Verify staff belongs to tenant
    const staff = await prisma.user.findFirst({
      where: {
        id: staffId,
        tenantId,
        role: "LAB_STAFF",
      },
    });

    if (!staff) {
      return { error: "Staff not found" };
    }

    await prisma.user.update({
      where: { id: staffId },
      data: { active: !staff.active },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Error toggling staff active status:", error);
    return { error: "Failed to update staff status" };
  }
}
