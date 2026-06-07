import { getTranslations } from "next-intl/server";

export default async function TasksPage() {
  const t = await getTranslations("nav");
  return (
    <div>
      <h1 className="text-2xl font-bold">{t("tasks")}</h1>
      <p className="text-muted-foreground mt-2">Production scheduling — coming in Phase 2.</p>
    </div>
  );
}
