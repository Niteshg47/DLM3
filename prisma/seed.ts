import { PrismaClient, CaseStatus, CaseType, CasePriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const caseTypes: CaseType[] = [
  "CROWN",
  "BRIDGE",
  "DENTURE",
  "IMPLANT",
  "ALIGNER",
  "OTHER",
];

const statuses: CaseStatus[] = [
  "RECEIVED",
  "IN_PROGRESS",
  "QC_HOLD",
  "READY",
  "DELIVERED",
];

const priorities: CasePriority[] = ["NORMAL", "URGENT", "STAT"];

const patientNames = [
  "Rajesh Kumar",
  "Priya Sharma",
  "Amit Patel",
  "Sneha Reddy",
  "Vikram Singh",
  "Anita Desai",
  "Mohammed Ali",
  "Kavita Nair",
  "Suresh Iyer",
  "Deepa Menon",
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Demo Dental Lab",
      brandColor: "#0ea5e9",
      plan: "PROFESSIONAL",
      gstNumber: "29ABCDE1234F1Z5",
      address: "123 Lab Street, Bengaluru, Karnataka 560001",
      onboardingDone: true,
      whatsappEnabled: false,
    },
  });

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.lab" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Lab Admin",
      email: "admin@demo.lab",
      passwordHash,
      role: "ADMIN",
      language: "en",
    },
  });

  const staff = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "staff@demo.lab" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Lab Technician",
      email: "staff@demo.lab",
      passwordHash,
      role: "LAB_STAFF",
      language: "en",
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "doctor@demo.lab" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Dr. Ananya Rao",
      email: "doctor@demo.lab",
      passwordHash,
      role: "DOCTOR",
      language: "en",
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: doctorUser.id,
      clinicName: "Smile Care Dental Clinic",
      phone: "+919876543210",
      address: "45 MG Road, Bengaluru",
    },
  });

  const year = new Date().getFullYear();

  for (let i = 0; i < 10; i++) {
    const caseNumber = `LAB-${year}-${String(i + 1).padStart(4, "0")}`;
    const receivedAt = new Date();
    receivedAt.setDate(receivedAt.getDate() - (10 - i));

    const dueDate = new Date(receivedAt);
    dueDate.setDate(dueDate.getDate() + 7);

    await prisma.case.upsert({
      where: {
        tenantId_caseNumber: { tenantId: tenant.id, caseNumber },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        caseNumber,
        doctorId: doctor.id,
        patientName: patientNames[i],
        patientAge: 25 + i * 3,
        patientGender: i % 2 === 0 ? "Male" : "Female",
        caseType: caseTypes[i % caseTypes.length],
        priority: priorities[i % priorities.length],
        receivedAt,
        dueDate,
        status: statuses[i % statuses.length],
        notes: `Sample case ${i + 1} for demo lab.`,
        shade: "A2",
        units: 1 + (i % 3),
      },
    });
  }

  const cases = await prisma.case.findMany({
    where: { tenantId: tenant.id },
    take: 3,
  });

  for (const c of cases) {
    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        caseId: c.id,
        assignedToId: staff.id,
        title: "Prepare model",
        status: "TODO",
        dueDate: c.dueDate,
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: admin.id,
        action: "CREATE",
        entity: "Case",
        entityId: cases[0]?.id,
        meta: { message: "Seed data created" },
      },
      {
        tenantId: tenant.id,
        userId: staff.id,
        action: "UPDATE",
        entity: "Case",
        meta: { status: "IN_PROGRESS" },
      },
    ],
  });

  console.log("Seed complete:");
  console.log("  Tenant: demo");
  console.log("  Admin: admin@demo.lab / password123");
  console.log("  Staff: staff@demo.lab / password123");
  console.log("  Doctor: doctor@demo.lab / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
