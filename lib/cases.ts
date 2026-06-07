import { prisma } from "@/lib/prisma";

export async function generateCaseNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LAB-${year}-`;

  const lastCase = await prisma.case.findFirst({
    where: {
      tenantId,
      caseNumber: { startsWith: prefix },
    },
    orderBy: { caseNumber: "desc" },
  });

  let nextNum = 1;
  if (lastCase) {
    const parts = lastCase.caseNumber.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}
