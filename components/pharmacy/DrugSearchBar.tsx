"use client";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface Props {
  onResults: (drugs: any[]) => void;
  onSelect: (drug: any) => void;
}

export function DrugSearchBar({ onResults, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (value: string) => {
    if (value.length < 2) {
      onResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacy/search?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      onResults(data.drugs);
    } finally {
      setLoading(false);
    }
  }, [onResults]);

  return (
    <div className="relative">
      {/* شريط البحث */}
      <div className="flex items-center gap-3 border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary/20">
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-muted-foreground" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="اكتب اسم الدواء... مثال: باراسيتامول"
          className="flex-1 bg-transparent outline-none text-sm text-right"
          dir="rtl"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); onResults([]); }}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* اقتراح "هل تعني" */}
      {query.length >= 2 && !loading && (
        <p className="text-xs text-muted-foreground mt-2 text-right px-1">
          نتائج البحث عن: <span className="text-primary font-medium">{query}</span>
        </p>
      )}
    </div>
  );
}