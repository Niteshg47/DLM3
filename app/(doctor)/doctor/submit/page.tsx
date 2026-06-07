import { getTranslations } from "next-intl/server";
import { DoctorCaseForm } from "@/components/doctor/doctor-case-form";

export default async function DoctorSubmitPage() {
  const t = await getTranslations("doctor");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("submitCase")}</h1>
      <DoctorCaseForm />
    </div>
  );
}
