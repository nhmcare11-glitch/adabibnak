"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Upload, MapPin, Phone, Clock, Package, X, Loader2 } from "lucide-react";

interface Pharmacy {
  id: string;
  name: string;
  nameAr: string;
  address: string;
  city: string;
  phone: string;
  isOpen24h: boolean;
  inStock: boolean;
  price: number;
  distance: number | null;
}

interface DrugResult {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  requiresPrescription: boolean;
  pharmacies: Pharmacy[];
}

export default function PharmacyPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DrugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [extractedDrugs, setExtractedDrugs] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // GPS تلقائي
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const params = new URLSearchParams({ q });
    if (location) {
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
    }
    const res = await fetch(`/api/pharmacy/search?${params}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  const analyzeImage = async (file: File) => {
  setAnalyzing(true);
  setImagePreview(URL.createObjectURL(file));
  const form = new FormData();
  form.append("image", file);

  try {
    const res = await fetch("/api/pharmacy/analyze", { method: "POST", body: form });
    const data = await res.json();
    console.log("Extracted drugs:", data);
    const drugs: string[] = data.drugs || [];
    setExtractedDrugs(drugs);

    if (drugs.length > 0) {
      setQuery(drugs[0]);
      // ابحث مباشرة بدون الاعتماد على state
      setLoading(true);
      const params = new URLSearchParams({ q: drugs[0] });
      if (location) {
        params.set("lat", location.lat.toString());
        params.set("lng", location.lng.toString());
      }
      const searchRes = await fetch(`/api/pharmacy/search?${params}`);
      const searchData = await searchRes.json();
      setResults(searchData);
      setLoading(false);
    } else {
      alert("لم يتم العثور على أدوية في الصورة، حاول صورة أوضح");
    }
  } catch (err) {
    console.error("Analysis error:", err);
    alert("حدث خطأ في تحليل الصورة");
  } finally {
    setAnalyzing(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">البحث عن الأدوية</h1>
          <p className="text-gray-500 text-sm mt-1">
            {location ? (
              <span className="flex items-center gap-1 text-green-600">
                <MapPin className="w-3 h-3" /> تم تحديد موقعك
              </span>
            ) : (
              "يرجى السماح بالوصول للموقع لعرض أقرب الصيدليات"
            )}
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(query)}
              placeholder="اكتب اسم الدواء..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="rtl"
            />
          </div>
          <button
            onClick={() => search(query)}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
          </button>
        </div>

        {/* Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && analyzeImage(e.target.files[0])}
          />
          {analyzing ? (
            <div className="flex flex-col items-center gap-2 text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>جاري تحليل الوصفة...</span>
            </div>
          ) : imagePreview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={imagePreview} className="h-24 object-contain rounded-lg" />
              <span className="text-sm text-gray-500">انقر لتغيير الصورة</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="w-8 h-8" />
              <span>ارفع صورة الوصفة الطبية</span>
              <span className="text-xs">PNG, JPG, WEBP</span>
            </div>
          )}
        </div>

        {/* Extracted Drugs */}
        {extractedDrugs.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">الأدوية المستخرجة من الوصفة:</p>
            <div className="flex flex-wrap gap-2">
              {extractedDrugs.map((drug) => (
                <button
                  key={drug}
                  onClick={() => { setQuery(drug); search(drug); }}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 transition-colors"
                >
                  {drug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((drug) => (
              <div key={drug.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">{drug.nameAr || drug.name}</h2>
                      <p className="text-sm text-gray-500">{drug.name} · {drug.category}</p>
                    </div>
                    {drug.requiresPrescription && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">يحتاج وصفة</span>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {drug.pharmacies.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400 text-center">لا توجد صيدليات مسجلة لهذا الدواء</p>
                  ) : (
                    drug.pharmacies.map((ph) => (
                      <div key={ph.id} className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-white">{ph.nameAr || ph.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ph.address}
                            {ph.distance && <span className="text-blue-500 mr-1">· {ph.distance} كم</span>}
                          </p>
                          {ph.phone && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ph.phone}
                            </p>
                          )}
                          {ph.isOpen24h && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> مفتوح 24 ساعة
                            </span>
                          )}
                        </div>
                        <div className="text-left space-y-1">
                          <span className={`block text-xs px-2 py-1 rounded-full text-center ${ph.inStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                            {ph.inStock ? "متوفر" : "غير متوفر"}
                          </span>
                          {ph.price && (
                            <p className="text-xs text-gray-500 text-center">{ph.price} د.ج</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لم يتم العثور على نتائج لـ "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}