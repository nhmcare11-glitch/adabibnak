"use client";
import { useState } from "react";
import dynamic from "next/dynamic";  // ← أضف هذا
import { DrugSearchBar } from "./DrugSearchBar";
import { PrescriptionUpload } from "./PrescriptionUpload";
import { DrugResultCard } from "./DrugResultCard";

// ← بدل import عادي، استخدم dynamic
const PharmacyMap = dynamic(() => import("./PharmacyMap"), { ssr: false });

export function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<"search" | "prescription">("search");
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium">الصيدلية الإلكترونية</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ابحث عن دواءك أو ارفع وصفتك للعثور على أقرب صيدلية
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["search", "prescription"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeTab === tab
                ? "bg-secondary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "search" ? "🔍 بحث عن دواء" : "📋 رفع وصفة"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "search" ? (
        <DrugSearchBar onResults={setDrugs} onSelect={setSelectedDrug} />
      ) : (
        <PrescriptionUpload onExtracted={setDrugs} />
      )}

      {/* Results */}
      {drugs.length > 0 && (
        <div className="space-y-3">
          {drugs.map((drug: any) => (
            <DrugResultCard
              key={drug.id}
              drug={drug}
              onSelect={() => setSelectedDrug(drug)}
              isSelected={selectedDrug?.id === drug.id}
            />
          ))}
        </div>
      )}

      {/* Map */}
      {selectedDrug && <PharmacyMap drugId={selectedDrug.id} />}
    </div>
  );
}