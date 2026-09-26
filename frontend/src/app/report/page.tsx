"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { submitWasteReport } from "@/lib/api";
import {
  resolveBestLocation,
  reverseGeocode,
  geocodeSearch,
  LocationResult,
} from "@/lib/location";
import {
  Camera,
  MapPin,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Sparkles,
  CheckCircle2,
  Navigation,
  Search,
  Crosshair,
  Layers,
  Loader2,
  X,
  Building2,
  TreePine,
  ShoppingBag,
} from "lucide-react";

export default function ReportWastePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("plastic");
  const [otherDescription, setOtherDescription] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0.94);
  const [probsJson, setProbsJson] = useState<string>("{}");

  const [latitude, setLatitude] = useState<number>(18.52043);
  const [longitude, setLongitude] = useState<number>(73.856744);
  const [address, setAddress] = useState<string>("Civic Central Square, Downtown Sector");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<
    "gps" | "photo_exif" | "network" | "manual" | "fallback"
  >("fallback");
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map and Search state
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; displayName: string }>
  >([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const searchDebounceRef = useRef<any>(null);

  // Helper to sync coordinates to map and state
  const updatePosition = (
    newLat: number,
    newLng: number,
    newAddress: string,
    source: "gps" | "photo_exif" | "network" | "manual" | "fallback"
  ) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setAddress(newAddress);
    setLocationSource(source);

    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true });
    }
  };

  // Detect location via multi-tier resolver (EXIF -> GPS -> Network IP)
  const handleDetectLocation = async (targetFile?: File | null) => {
    setLocating(true);
    setErrorMsg(null);
    try {
      const loc: LocationResult = await resolveBestLocation(targetFile || imageFile || undefined);
      updatePosition(loc.latitude, loc.longitude, loc.address, loc.source);
    } catch (err: any) {
      console.warn("Location detection error:", err);
      setErrorMsg("Location detection unavailable. Tap the map to pinpoint.");
    } finally {
      setLocating(false);
    }
  };

  // Load scan session data and pre-resolved coordinates on mount
  useEffect(() => {
    const savedImg = sessionStorage.getItem("w2w_scan_image");
    const savedCat = sessionStorage.getItem("w2w_scan_category");
    const savedConf = sessionStorage.getItem("w2w_scan_confidence");
    const savedProbs = sessionStorage.getItem("w2w_scan_probs");

    const savedLat = sessionStorage.getItem("w2w_scan_lat");
    const savedLng = sessionStorage.getItem("w2w_scan_lng");
    const savedAddress = sessionStorage.getItem("w2w_scan_address");
    const savedSource = sessionStorage.getItem("w2w_scan_loc_source");

    let locationRestored = false;
    if (savedLat && savedLng && savedAddress) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setLatitude(lat);
        setLongitude(lng);
        setAddress(savedAddress);
        setLocationSource(
          (savedSource as "gps" | "photo_exif" | "network" | "manual" | "fallback") || "gps"
        );
        locationRestored = true;
      }
    }

    if (savedImg && savedCat) {
      setImagePreview(savedImg);
      setCategory(savedCat.toLowerCase());
      if (savedConf) setConfidence(parseFloat(savedConf));
      if (savedProbs) setProbsJson(savedProbs);

      fetch(savedImg)
        .then((res) => res.blob())
        .then(async (blob) => {
          const file = new File([blob], "scanned_waste.jpg", { type: "image/jpeg" });
          setImageFile(file);

          if (!locationRestored) {
            await handleDetectLocation(file);
          }
        });

      setStep(2);
    } else if (!locationRestored) {
      handleDetectLocation();
    }
  }, []);

  // Handle file upload in Step 1
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(2);

      // Attempt to resolve location directly from uploaded file EXIF GPS
      await handleDetectLocation(file);
    }
  };

  // Initialize or update Leaflet Map when Step 3 is reached
  useEffect(() => {
    if (step !== 3 || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous map if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const currentLat = latitude || 18.52043;
      const currentLng = longitude || 73.856744;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([currentLat, currentLng], 16);

      mapInstanceRef.current = map;

      const tileUrl =
        mapType === "satellite"
          ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      // Custom Apple-styled Emerald Pin with radar wave
      const pinIcon = L.divIcon({
        className: "waste-pin-marker",
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%); cursor: grab;">
            <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.6);">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #000000;"></div>
            </div>
            <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%) translateY(90%); width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid #10b981;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Handle Pin Dragging
      marker.on("dragend", async (e: any) => {
        const pos = e.target.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        setLatitude(newLat);
        setLongitude(newLng);
        setLocationSource("manual");
        setLocating(true);
        try {
          const rev = await reverseGeocode(newLat, newLng);
          setAddress(rev.address);
        } finally {
          setLocating(false);
        }
      });

      // Handle Map Click to Pinpoint
      map.on("click", async (e: any) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([newLat, newLng]);
        setLatitude(newLat);
        setLongitude(newLng);
        setLocationSource("manual");
        setLocating(true);
        try {
          const rev = await reverseGeocode(newLat, newLng);
          setAddress(rev.address);
        } finally {
          setLocating(false);
        }
      });

      // Recalculate dimensions for smooth rendering
      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
        }
      }, 150);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [step, mapType]);

  // Handle Search Input with Debounce
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geocodeSearch(query);
        setSearchResults(results);
        setSearchOpen(results.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select Search Autocomplete Suggestion
  const handleSelectSearchResult = (result: {
    lat: number;
    lng: number;
    displayName: string;
  }) => {
    setSearchOpen(false);
    setSearchQuery("");
    updatePosition(result.lat, result.lng, result.displayName, "manual");
  };

  // Quick Preset Handlers
  const handleSelectPreset = async (name: string, lat: number, lng: number) => {
    setLocating(true);
    try {
      const rev = await reverseGeocode(lat, lng);
      updatePosition(lat, lng, rev.address || name, "manual");
    } finally {
      setLocating(false);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!imageFile) {
      setErrorMsg("Please provide a waste photo");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("category", category);
      formData.append("predicted_class", category);
      formData.append("confidence", confidence.toString());
      formData.append("ai_class_probabilities", probsJson);
      formData.append("class_probabilities_json", probsJson);

      const finalLat = latitude || 18.52043;
      const finalLng = longitude || 73.856744;
      const finalAddress =
        address && !address.includes("permission")
          ? address
          : `Community Location (${finalLat}, ${finalLng})`;

      formData.append("latitude", finalLat.toString());
      formData.append("longitude", finalLng.toString());
      formData.append("address", finalAddress);

      const fullDesc =
        category === "other"
          ? `[Special Waste: ${otherDescription || "Unclassified"}] ${description}`.trim()
          : description.trim();

      formData.append("description", fullDesc || "Reported via Waste2Worth AI");

      await submitWasteReport(formData);

      // Clear scan and location session cache
      sessionStorage.removeItem("w2w_scan_image");
      sessionStorage.removeItem("w2w_scan_category");
      sessionStorage.removeItem("w2w_scan_confidence");
      sessionStorage.removeItem("w2w_scan_probs");
      sessionStorage.removeItem("w2w_scan_lat");
      sessionStorage.removeItem("w2w_scan_lng");
      sessionStorage.removeItem("w2w_scan_address");
      sessionStorage.removeItem("w2w_scan_loc_source");

      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Submission failed. Please check network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "plastic", name: "Plastic" },
    { id: "paper", name: "Paper" },
    { id: "cardboard", name: "Cardboard" },
    { id: "glass", name: "Glass" },
    { id: "metal", name: "Metal" },
    { id: "e-waste", name: "E-Waste" },
    { id: "medical", name: "Medical" },
    { id: "other", name: "Special Waste" },
  ];

  if (submittedSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
          <Check className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
          Report Submitted
        </h2>
        <p className="text-xs text-[#86868b] max-w-xs mb-8 leading-relaxed">
          Your waste report is now in the municipal queue. You will earn +50 Eco Points once verified and collected.
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => router.push("/my-reports")}
            className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all active:scale-[0.98]"
          >
            Track in My Reports
          </button>
          <button
            onClick={() => router.push("/scanner")}
            className="w-full py-3.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium text-xs border border-white/[0.08] transition-all active:scale-[0.98]"
          >
            Scan Another Item
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-16 w-full flex flex-col flex-1 animate-fade-in-up">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-10 bg-emerald-400"
                  : i < step
                  ? "w-4 bg-white/40"
                  : "w-4 bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-mono text-[#86868b]">
          Step {step} of 5
        </span>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: Waste Photo */}
      {step === 1 && (
        <div className="space-y-6 animate-scale-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Waste Photo
            </h1>
            <p className="text-sm text-[#86868b] mt-1.5">
              Capture or upload an image of the waste item.
            </p>
          </div>

          {imagePreview ? (
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border border-white/[0.12] shadow-2xl">
              <img
                src={imagePreview}
                alt="Waste Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] flex flex-col items-center justify-center text-center">
              <Camera className="w-12 h-12 text-[#86868b] mb-4" />
              <p className="text-base text-white font-medium mb-1">No photo chosen yet</p>
              <p className="text-xs sm:text-sm text-[#86868b] max-w-xs mb-6">
                Use your device camera or upload from your library.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
                <button
                  onClick={() => router.push("/scanner")}
                  className="w-full px-6 py-3.5 rounded-full bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400 transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/20"
                >
                  Open Camera Scanner
                </button>
                <label className="w-full cursor-pointer px-5 py-3.5 rounded-full bg-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.14] transition-all active:scale-[0.97] text-center border border-white/[0.08]">
                  Upload File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {imagePreview && (
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => router.push("/scanner")}
                className="text-sm text-[#86868b] hover:text-white transition-colors"
              >
                Retake in scanner
              </button>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-all active:scale-[0.97]"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: AI Classification */}
      {step === 2 && (
        <div className="space-y-6 animate-scale-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Classification
            </h1>
            <p className="text-sm text-[#86868b] mt-1.5">
              Select or confirm the waste material stream.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`py-4 px-4.5 rounded-2xl text-sm font-medium text-left transition-all flex items-center justify-between ${
                  category === cat.id
                    ? "bg-white text-black font-semibold shadow-lg scale-[1.01]"
                    : "bg-[#0c0c0e] text-[#86868b] hover:text-white border border-white/[0.06]"
                }`}
              >
                <span>{cat.name}</span>
                {category === cat.id && <Check className="w-4 h-4 stroke-[2.5]" />}
              </button>
            ))}
          </div>

          {category === "other" && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <label className="text-sm text-[#86868b]">
                Special Waste Description
              </label>
              <input
                type="text"
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                placeholder="e.g. Broken porcelain, construction debris..."
                className="w-full px-4 py-3.5 rounded-xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-all active:scale-[0.97]"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Interactive Location & Google-styled GIS Map */}
      {step === 3 && (
        <div className="space-y-5 animate-scale-up">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Location
              </h1>
              <p className="text-sm text-[#86868b] mt-1.5">
                Pinpoint the exact location for municipal collector dispatch.
              </p>
            </div>

            {/* Location Source Badge */}
            <div className="mt-1">
              {locationSource === "photo_exif" && (
                <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[11px] font-semibold flex items-center gap-1">
                  📸 Photo GPS
                </span>
              )}
              {locationSource === "gps" && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold flex items-center gap-1">
                  🎯 GPS Active
                </span>
              )}
              {locationSource === "network" && (
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold flex items-center gap-1">
                  🌐 Network IP
                </span>
              )}
              {locationSource === "manual" && (
                <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[11px] font-semibold flex items-center gap-1">
                  📍 Pinned on Map
                </span>
              )}
              {locationSource === "fallback" && (
                <span className="px-3 py-1 rounded-full bg-neutral-500/15 text-neutral-400 border border-neutral-500/25 text-[11px] font-semibold flex items-center gap-1">
                  🏛️ Default Zone
                </span>
              )}
            </div>
          </div>

          {/* Place Search with Autocomplete */}
          <div className="relative z-30">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#86868b] absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                placeholder="Search street, landmark, or area..."
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-[#86868b]"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-4" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchOpen(false);
                  }}
                  className="p-1 rounded-full hover:bg-white/10 text-[#86868b] hover:text-white absolute right-3 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Autocomplete Dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#16161a] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.08] transition-colors border-b border-white/[0.04] last:border-b-0 flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-white leading-relaxed line-clamp-2">
                      {res.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Leaflet Map View */}
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-[#0c0c0e] shadow-2xl">
            {/* Map Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full h-64 sm:h-72 z-10"
              style={{ minHeight: "260px" }}
            />

            {/* Map Controls Floating Header */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
              {/* Map Type Switcher */}
              <div className="pointer-events-auto flex items-center bg-black/70 backdrop-blur-md rounded-full p-1 border border-white/[0.12] shadow-lg">
                <button
                  type="button"
                  onClick={() => setMapType("streets")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    mapType === "streets"
                      ? "bg-white text-black font-semibold shadow"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Streets
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    mapType === "satellite"
                      ? "bg-white text-black font-semibold shadow"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* High-Accuracy Locate Me Button */}
              <button
                type="button"
                onClick={() => handleDetectLocation()}
                disabled={locating}
                className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/80 hover:bg-black text-emerald-400 hover:text-emerald-300 backdrop-blur-md border border-emerald-500/30 text-xs font-semibold shadow-lg transition-all active:scale-95"
                title="Detect precise GPS location"
              >
                <Crosshair className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
                <span>{locating ? "Locating..." : "Locate Me"}</span>
              </button>
            </div>

            {/* Map Tap Guide Banner */}
            <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex justify-center">
              <span className="px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/[0.1] text-[11px] text-white/90 shadow-md">
                👆 Drag pin or tap map to adjust location
              </span>
            </div>
          </div>

          {/* Reverse Geocoded Street Address Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
              <div className="flex-1 space-y-1">
                <label className="text-[11px] uppercase tracking-wider text-[#86868b] font-semibold">
                  Detected Street Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address or landmark"
                  className="w-full bg-transparent text-sm text-white font-medium focus:outline-none resize-none leading-relaxed border-b border-transparent focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] font-mono text-[#86868b]">
              <span>Latitude: {latitude.toFixed(6)}</span>
              <span>Longitude: {longitude.toFixed(6)}</span>
            </div>
          </div>

          {/* Quick Area Preset Chips for 1-tap testing */}
          <div className="space-y-2">
            <span className="text-xs text-[#86868b] font-medium">Quick Landmarks:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset("Downtown Civic Center, Ward 4", 18.52043, 73.856744)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs text-white transition-all active:scale-95"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Civic Center</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset("Central Market Square, Sector 2", 18.5314, 73.8446)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs text-white transition-all active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                <span>Central Market</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset("Greenfield Public Park, North Gate", 18.5145, 73.8652)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs text-white transition-all active:scale-95"
              >
                <TreePine className="w-3.5 h-3.5 text-emerald-400" />
                <span>Public Park</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-all active:scale-[0.97]"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Notes */}
      {step === 4 && (
        <div className="space-y-6 animate-scale-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Notes
            </h1>
            <p className="text-sm text-[#86868b] mt-1.5">
              Add optional access directions or disposal notes for the collector.
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Behind the community park bench, accessible from the north walkway."
              className="w-full px-4 py-3.5 rounded-2xl bg-[#0c0c0e] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(5)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-all active:scale-[0.97]"
            >
              <span>Review Report</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Submit */}
      {step === 5 && (
        <div className="space-y-6 animate-scale-up">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Review &amp; Submit
            </h1>
            <p className="text-sm text-[#86868b] mt-1.5">
              Please verify report details before dispatching.
            </p>
          </div>

          <div className="p-6.5 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4.5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
              <span className="text-sm text-[#86868b]">Category</span>
              <span className="text-sm font-semibold text-white capitalize">{category}</span>
            </div>

            <div className="flex items-start justify-between border-b border-white/[0.06] pb-3.5">
              <span className="text-sm text-[#86868b]">Address</span>
              <span className="text-sm font-medium text-white max-w-[280px] text-right truncate">
                {address || "Coordinates recorded"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
              <span className="text-sm text-[#86868b]">Estimated Eco Points</span>
              <span className="text-base font-semibold text-emerald-400 font-mono">+50 pts</span>
            </div>

            {description && (
              <div className="space-y-1.5 pt-1">
                <span className="text-xs text-[#86868b]">Citizen Notes:</span>
                <p className="text-sm text-white/90 leading-relaxed">{description}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 text-sm text-[#86868b] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-semibold transition-all active:scale-[0.97] shadow-lg shadow-emerald-500/25 animate-pulse-glow"
            >
              <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
