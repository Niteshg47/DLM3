import { getTranslations } from "next-intl/server";

export async function ActivityFeed({
  items,
}: {
  items: {
    id: string;
    action: string;
    entity: string;
    userName: string;
    createdAt: string;
  }[];
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="rounded-xl bg-white p-5 shadow-card h-fit">
      <h3 className="font-semibold text-slate-800 mb-4">{t("activity")}</h3>
      <ul className="space-y-3 text-sm max-h-[400px] overflow-y-auto">
        {items.length === 0 ? (
          <li className="text-muted-foreground text-center py-8">No activity yet</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex gap-3 pb-3 border-b border-slate-50 last:border-0"
            >
              <span className="shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {item.userName[0]}
              </span>
              <div>
                <p className="text-slate-800">
                  <span className="font-medium">{item.userName}</span>{" "}
                  {item.action.toLowerCase()}{" "}
                  <span className="text-brand-indigo">{item.entity}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.createdAt}</p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
