import { prisma } from "@/lib/prisma";

export async function generateAndStoreOtp(
  tenantId: string,
  userId: string,
  email: string
): Promise<string> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 10 minutes from now
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  
  // Delete any existing OTPs for this user
  await prisma.adminOtp.deleteMany({
    where: { tenantId, userId },
  });
  
  // Store the new OTP
  await prisma.adminOtp.create({
    data: {
      tenantId,
      userId,
      otp,
      expires,
    },
  });
  
  return otp;
}

export async function verifyOtp(
  tenantId: string,
  userId: string,
  otp: string
): Promise<boolean> {
  const record = await prisma.adminOtp.findFirst({
    where: {
      tenantId,
      userId,
      otp,
      expires: { gt: new Date() },
    },
  });
  
  if (!record) {
    return false;
  }
  
  // Delete the OTP after successful verification
  await prisma.adminOtp.delete({
    where: { id: record.id },
  });
  
  return true;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // For now, we'll just return the OTP to be displayed in the UI
  // In production, this would use Resend API
  if (process.env.RESEND_API_KEY) {
    // TODO: Implement Resend email sending
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@dentallab.app',
    //   to: email,
    //   subject: 'Your Login OTP',
    //   html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
    // });
  }
}
