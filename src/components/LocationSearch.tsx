"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  context?: { text: string }[];
}

export default function LocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { setGlobeCenter, setGlobeScale } = useStore();

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsLoading(true);
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              query
            )}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address,poi&limit=5`
          );
          const data = await res.json();
          if (data.features) {
            setResults(data.features);
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const [lng, lat] = result.center;
    
    // Fly to location
    setGlobeCenter({ lat, lng });
    
    // Auto zoom in for city/place context
    // Scale 3.0 is roughly Zoom 17 (Street level)
    setGlobeScale(2.0);

    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto font-mono">
      {/* Input Field */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-cyan-500/70 group-focus-within:text-cyan-400 transition-colors" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ENTER COORDINATES OR TARGET..."
          className="w-full bg-black/60 backdrop-blur-md border border-cyan-900/50 text-cyan-100 pl-12 pr-4 py-3 rounded-none focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 placeholder-cyan-800/50 transition-all text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(0,255,255,0.05)] focus:shadow-[0_0_20px_rgba(0,255,255,0.15)] placeholder-gray-500"
        />
        {/* Decorative Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500 opacity-50" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500 opacity-50" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500 opacity-50" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500 opacity-50" />
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full bg-black/90 backdrop-blur-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)] overflow-hidden z-50">
          <div className="px-2 py-1 bg-cyan-950/30 border-b border-cyan-500/20 text-[10px] text-cyan-600 tracking-widest uppercase">
            Search Results
          </div>
          <ul>
            {results.map((result) => (
              <li key={result.id}>
                <button
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 hover:bg-cyan-500/10 transition-colors flex items-start gap-3 group border-b border-cyan-500/10 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-cyan-600 group-hover:text-cyan-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-cyan-100 text-sm font-bold tracking-wide group-hover:text-white group-hover:shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all">
                      {result.place_name.split(",")[0]}
                    </div>
                    <div className="text-cyan-700 text-xs truncate max-w-[280px]">
                      {result.place_name.split(",").slice(1).join(",")}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
