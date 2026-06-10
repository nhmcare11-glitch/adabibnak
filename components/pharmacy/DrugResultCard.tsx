"use client";

interface Props {
  drug: any;
  onSelect: () => void;
  isSelected: boolean;
}

export function DrugResultCard({ drug, onSelect, isSelected }: Props) {
  const availableCount = drug.pharmacyDrugs?.filter((pd: any) => pd.isAvailable).length ?? 0;

  const status =
    availableCount > 0 ? "available" :
    drug.alternatives?.length > 0 ? "alternative" : "unavailable";

  const statusConfig = {
    available: {
      label: "متوفر",
      color: "bg-green-100 text-green-700 border-green-200",
      dot: "bg-green-500",
    },
    alternative: {
      label: "بديل متوفر",
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      dot: "bg-yellow-500",
    },
    unavailable: {
      label: "غير متوفر",
      color: "bg-red-100 text-red-500 border-red-200",
      dot: "bg-red-500",
    },
  }[status];

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* معلومات الدواء */}
        <div className="space-y-1 text-right">
          <p className="font-medium text-sm">{drug.nameAr}</p>
          {drug.nameEn && (
            <p className="text-xs text-muted-foreground">{drug.nameEn}</p>
          )}
          <div className="flex items-center gap-2 justify-end flex-wrap">
            {drug.form && (
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {drug.form}
              </span>
            )}
            {drug.strength && (
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {drug.strength}
              </span>
            )}
          </div>
        </div>

        {/* حالة التوفر */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs whitespace-nowrap ${statusConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </div>
      </div>

      {/* بديل مقترح */}
      {status === "alternative" && drug.alternatives?.[0] && (
        <div className="mt-3 pt-3 border-t border-yellow-200 text-right">
          <p className="text-xs text-muted-foreground">
            بديل مقترح:{" "}
            <span className="text-yellow-700 font-medium">
              {drug.alternatives[0].nameAr}
            </span>
            {" "}—{" "}
            <span className="text-yellow-600/70">يُنصح بمراجعة الطبيب</span>
          </p>
        </div>
      )}

      {/* عدد الصيدليات */}
      {availableCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-right">
          متوفر في{" "}
          <span className="text-primary font-medium">{availableCount}</span>{" "}
          صيدلية قريبة — اضغط لعرض الخريطة
        </p>
      )}
    </div>
  );
}