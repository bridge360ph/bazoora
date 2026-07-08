"use client";

import { ChevronRight, Loader2, Package, Camera, MapPin, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LocationPickerMapbox from "@/components/map/location-picker-mapbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useHaulingRequests,
  useCreateHaulingRequest,
  useUploadImage,
} from "@/features/hauling-requests/hooks";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { getImageUrl } from "@/lib/utils";
import { reverseGeocode } from "@/lib/geocoding";

function formatAddress(
  address: { line1: string; barangay: string; city: string; province: string } | null | undefined,
): string {
  if (!address) return "";
  return [address.line1, address.barangay, address.city, address.province]
    .filter(Boolean)
    .join(", ");
}

function StatusBadge({ status }: { status: string }): React.ReactNode {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-600",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const s = status.toLowerCase();

  return (
    <Badge
      className={`border-0 text-[11px] font-semibold ${styles[s] || "bg-gray-100 text-gray-700"} transition-opacity hover:opacity-80`}
    >
      {labels[s] || status}
    </Badge>
  );
}

const calculateEstimatedPrice = (waste: string, vol: string): number => {
  const basePrices: Record<string, number> = {
    bulky: 300,
    garden: 150,
    construction: 500,
    electronic: 200,
    general: 100,
  };
  const volumeMultipliers: Record<string, number> = {
    small: 1,
    medium: 1.5,
    large: 2.5,
    truckload: 5,
  };
  const base = basePrices[waste] ?? 0;
  const mult = volumeMultipliers[vol] ?? 0;
  return base * mult;
};

export default function ResidentHaulingRequests(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const [wasteType, setWasteType] = useState<string>("");
  const [volume, setVolume] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState(formatAddress(user?.address));
  const [isDetecting, setIsDetecting] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new-request");
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"method" | "processing" | "success">("method");
  const [onlineGateway, setOnlineGateway] = useState<"gcash" | "maya" | "card">("gcash");

  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tempAddress, setTempAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: requests, isLoading } = useHaulingRequests();
  const createRequest = useCreateHaulingRequest();
  const uploadImage = useUploadImage();

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setDetectedLat(latitude);
          setDetectedLng(longitude);
          const result = await reverseGeocode(latitude, longitude);
          if (result.display_name) {
            setPickupAddress(result.display_name);
            toast.success("Location detected successfully");
          }
        } catch {
          toast.error("Failed to detect address");
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setIsDetecting(false);
      },
      { timeout: 10_000 },
    );
  };

  useEffect(() => {
    if (!pickupAddress && activeTab === "new-request" && !isDetecting) {
      detectLocation();
    }
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.addEventListener("load", () => {
        resolve(reader.result as string);
      });
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        uploadImage.mutate(
          { base64, mimeType: file.type },
          {
            onSuccess: (url) => {
              setPhotoUrl(url);
              toast.success("Image uploaded successfully");
            },
          },
        );
      } catch {
        toast.error("Failed to process image");
      }
    }
  };

  const handleSubmit = () => {
    if (!wasteType || !volume || !pickupAddress || !preferredDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (paymentMethod === "online") {
      setCheckoutStep("method");
      setShowCheckoutModal(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = () => {
    createRequest.mutate(
      {
        wasteType: wasteType as any,
        volume: volume as any,
        pickupAddress,
        lat: detectedLat || undefined,
        lng: detectedLng || undefined,
        preferredDate,
        notes: notes,
        photoUrl: photoUrl || undefined,
        paymentMethod: paymentMethod as any,
      },
      {
        onSuccess: () => {
          setWasteType("");
          setVolume("");
          setPreferredDate("");
          setNotes("");
          setPhotoUrl(null);
          setActiveTab("history");
          setShowCheckoutModal(false);
        },
      },
    );
  };

  return (
    <div className="dark:bg-background flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl p-4 pb-20 lg:p-6 lg:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-12 w-full rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-gray-700">
            <TabsTrigger
              value="new-request"
              className="h-full flex-1 rounded-none border-b-2 border-transparent bg-transparent text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-[#111] data-[state=active]:text-[#111] data-[state=active]:shadow-none dark:data-[state=active]:text-white dark:data-[state=active]:border-white cursor-pointer"
            >
              NEW REQUEST
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-full flex-1 rounded-none border-b-2 border-transparent bg-transparent text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-[#111] data-[state=active]:text-[#111] data-[state=active]:shadow-none dark:data-[state=active]:text-white dark:data-[state=active]:border-white cursor-pointer"
            >
              REQUEST HISTORY
            </TabsTrigger>
          </TabsList>

          {/* New Request Form */}
          <TabsContent value="new-request" className="mt-0">
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
              <CardContent className="space-y-5 p-5 lg:p-8">
                {/* Request ID */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Request ID
                  </label>
                  <div className="dark:bg-slate-800 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-750">
                    Auto-generated on submission
                  </div>
                </div>

                {/* Waste Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Waste Type
                  </label>
                  <Select
                    value={wasteType}
                    onValueChange={(val: string | null) => {
                      setWasteType(val || "");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-medium">
                      <SelectValue placeholder="Select waste type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bulky">Bulky Waste</SelectItem>
                      <SelectItem value="garden">Garden Waste</SelectItem>
                      <SelectItem value="construction">Construction Debris</SelectItem>
                      <SelectItem value="electronic">E-Waste</SelectItem>
                      <SelectItem value="general">General Waste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimated Volume */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Estimated Volume
                  </label>
                  <Select
                    value={volume}
                    onValueChange={(val: string | null) => {
                      setVolume(val || "");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-medium">
                      <SelectValue placeholder="Select volume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-3 bags)</SelectItem>
                      <SelectItem value="medium">Medium (4-8 bags)</SelectItem>
                      <SelectItem value="large">Large (9+ bags / bulky items)</SelectItem>
                      <SelectItem value="truckload">Truckload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pickup Address */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                      Pickup Address
                    </label>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={detectLocation}
                        disabled={isDetecting}
                        className="flex items-center gap-1 text-[10px] font-black tracking-wider text-emerald-600 uppercase hover:opacity-70 disabled:opacity-50 cursor-pointer"
                      >
                        {isDetecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        {isDetecting ? "Detecting..." : "Use Current Location"}
                      </button>
                      <span className="text-[10px] text-gray-300">|</span>
                      <button
                        onClick={() => {
                          const initLat = detectedLat ?? 14.1678;
                          const initLng = detectedLng ?? 121.2435;
                          setTempCoords({ lat: initLat, lng: initLng });
                          setTempAddress(pickupAddress);
                          setShowMapModal(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-black tracking-wider text-emerald-600 uppercase hover:opacity-70 cursor-pointer"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                          <line x1="9" y1="3" x2="9" y2="18" />
                          <line x1="15" y1="6" x2="15" y2="21" />
                        </svg>
                        Select on Map
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      value={pickupAddress}
                      onChange={(e) => {
                        setPickupAddress(e.target.value);
                      }}
                      placeholder="Enter your complete address..."
                      className="h-11 w-full rounded-xl border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 pr-10 font-medium focus:ring-1 focus:ring-[#0f2419]"
                    />
                    <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-350" />
                  </div>
                </div>

                {/* Preferred Date */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Preferred Pickup Date
                  </label>
                  <Input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => {
                      setPreferredDate(e.target.value);
                    }}
                    className="h-11 w-full rounded-xl border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-medium focus:ring-1 focus:ring-[#0f2419]"
                  />
                </div>

                {/* Photo Attachment */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Photo Attachment (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group dark:bg-slate-800 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-gray-700"
                  >
                    {uploadImage.isPending ? (
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    ) : photoUrl ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-2 h-20 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          <img
                            src={getImageUrl(photoUrl)}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-bold text-emerald-600">
                          Image uploaded successfully
                        </p>
                      </div>
                    ) : (
                      <>
                        <Camera className="mb-3 h-8 w-8 text-gray-300 transition-colors group-hover:text-emerald-400" />
                        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Tap to upload/capture photo
                        </p>
                        <p className="mt-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                          JPG, PNG UP TO 5MB
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Price Estimation and Payment Method */}
                {wasteType && volume && (
                  <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <div className="flex items-center justify-between border-b border-emerald-100/50 pb-3">
                      <div>
                        <p className="text-[10px] font-black tracking-widest text-emerald-800 dark:text-emerald-400 uppercase">
                          Estimated Price
                        </p>
                        <p className="mt-0.5 text-2xl font-black text-emerald-950 dark:text-white">
                          ₱{calculateEstimatedPrice(wasteType, volume)}
                        </p>
                      </div>
                      <div className="text-right text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                        <p>
                          Base: ₱
                          {wasteType === "bulky"
                            ? 300
                            : wasteType === "garden"
                              ? 150
                              : wasteType === "construction"
                                ? 500
                                : wasteType === "electronic"
                                  ? 200
                                  : 100}
                        </p>
                        <p className="mt-0.5">
                          Multiplier: x
                          {volume === "small"
                            ? "1.0"
                            : volume === "medium"
                              ? "1.5"
                              : volume === "large"
                                ? "2.5"
                                : "5.0"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("cash");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 p-3.5 text-center transition-all cursor-pointer ${
                            paymentMethod === "cash"
                              ? "border-[#0f2419] dark:border-white bg-emerald-50/50 font-bold text-[#0f2419] dark:text-white"
                              : "border-gray-200 bg-white dark:bg-slate-800 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">💵</span>
                          <span className="mt-1 text-xs font-black tracking-wide uppercase">
                            Cash on Collection
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold text-gray-400">
                            Pay Eco-Aide upon pickup
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod("online");
                          }}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 p-3.5 text-center transition-all cursor-pointer ${
                            paymentMethod === "online"
                              ? "border-[#0f2419] dark:border-white bg-emerald-50/50 font-bold text-[#0f2419] dark:text-white"
                              : "border-gray-200 bg-white dark:bg-slate-800 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">📱</span>
                          <span className="mt-1 text-xs font-black tracking-wide uppercase">
                            Online Payment
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold text-gray-400">
                            Pay now via GCash / Maya
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Additional Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                    }}
                    placeholder="Any special instructions for the hauler..."
                    className="min-h-[100px] resize-none rounded-xl border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 text-sm font-medium focus:ring-1 focus:ring-[#0f2419]"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={createRequest.isPending}
                    className="h-12 w-full rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-[#0f2419]/20 transition-all hover:bg-black cursor-pointer"
                  >
                    {createRequest.isPending ? "SUBMITTING..." : "SUBMIT REQUEST"}
                    {!createRequest.isPending && <ChevronRight className="ml-1 h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request History */}
          <TabsContent value="history" className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Loading history...
                </p>
              </div>
            ) : requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card
                    key={request.id}
                    className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      {request.photoUrl && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-800">
                          <img
                            src={getImageUrl(request.photoUrl)}
                            alt="Hauling Request"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {format(new Date(request.createdAt), "MMM d, yyyy")}
                          </p>
                          <span className="h-1 w-1 rounded-full bg-gray-200" />
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {format(new Date(request.createdAt), "h:mm a")}
                          </p>
                        </div>
                        <p className="mt-1 text-base font-black text-gray-900 capitalize dark:text-white">
                          {request.wasteType.replaceAll("_", " ")}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                            ID: {request.id.slice(0, 8).toUpperCase()}
                          </p>
                          <Badge
                            variant="outline"
                            className="rounded-full border-gray-100 bg-gray-50 px-2 py-0.5 text-[9px] font-bold text-gray-550 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300"
                          >
                            {request.volume}
                          </Badge>
                          {request.price !== undefined && (
                            <Badge
                              className={`rounded-full border-0 px-2 py-0.5 text-[9px] font-bold ${
                                request.paymentStatus === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              ₱{request.price} ·{" "}
                              {request.paymentMethod === "cash" ? "Cash" : "Online"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <StatusBadge status={request.status} />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                          }}
                          className="flex items-center gap-1 text-[10px] font-black tracking-widest text-emerald-600 uppercase transition-all hover:translate-x-1 cursor-pointer"
                        >
                          Details <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="dark:bg-slate-900/50 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-white/50 py-20 text-center dark:border-gray-700">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-350">
                  <Package className="h-8 w-8" />
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  No requests found
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Your hauling history will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mock GCash/Online Payment Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 px-6 py-4">
              <div>
                <p className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">
                  Bazoora Pay
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">Secure Checkout</h3>
              </div>
              {checkoutStep !== "processing" && (
                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                  }}
                  className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              {checkoutStep === "method" && (
                <div className="w-full space-y-5">
                  <div className="pb-2 text-center">
                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                      Amount to Pay
                    </p>
                    <p className="mt-1 text-3xl font-black text-gray-900 dark:text-white">
                      ₱{calculateEstimatedPrice(wasteType, volume)}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                      Select Gateway
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setOnlineGateway("gcash");
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${
                          onlineGateway === "gcash"
                            ? "border-emerald-600 bg-emerald-50/30 font-bold text-emerald-800"
                            : "border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-base font-black text-blue-600">GCash</span>
                      </button>
                      <button
                        onClick={() => {
                          setOnlineGateway("maya");
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${
                          onlineGateway === "maya"
                            ? "border-emerald-600 bg-emerald-50/30 font-bold text-emerald-800"
                            : "border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-base font-black text-green-600">Maya</span>
                      </button>
                      <button
                        onClick={() => {
                          setOnlineGateway("card");
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${
                          onlineGateway === "card"
                            ? "border-emerald-600 bg-emerald-50/30 font-bold text-emerald-800"
                            : "border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700"
                        }`}
                      >
                        <span className="text-xs font-black text-gray-700 dark:text-gray-300">Card</span>
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setCheckoutStep("processing");
                      setTimeout(() => {
                        setCheckoutStep("success");
                        setTimeout(() => {
                          executeSubmit();
                        }, 1200);
                      }, 1500);
                    }}
                    className="h-12 w-full rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-black cursor-pointer"
                  >
                    Pay Now
                  </Button>
                </div>
              )}

              {checkoutStep === "processing" && (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                  <p className="mt-4 text-sm font-bold text-gray-700 dark:text-gray-300">Processing Payment...</p>
                  <p className="mt-1 text-[10px] text-gray-400">Please do not close this window</p>
                </div>
              )}

              {checkoutStep === "success" && (
                <div className="flex animate-bounce flex-col items-center py-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <span className="text-2xl font-black">✓</span>
                  </div>
                  <p className="mt-4 text-base font-black text-emerald-800">Payment Successful!</p>
                  <p className="mt-1 text-xs text-gray-500">Submitting request details...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 dark:bg-slate-900 dark:border-slate-800 relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="dark:bg-slate-950/50 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700">
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                  Hauling Request Details
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                  ID: {selectedRequest.requestId || selectedRequest.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                }}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* Status Section */}
              <div className="dark:bg-slate-800 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-405 uppercase">
                  Status
                </span>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {/* Payment Section */}
              <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 dark:bg-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                    Payment Method
                  </span>
                  <span className="text-xs font-black text-gray-800 dark:text-white uppercase">
                    {selectedRequest.paymentMethod === "cash"
                      ? "💵 Cash on Collection"
                      : "📱 Paid Online"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-slate-700 pt-2.5">
                  <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                    Payment Status
                  </span>
                  <Badge
                    className={
                      selectedRequest.paymentStatus === "paid"
                        ? "animate-pulse bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }
                  >
                    {selectedRequest.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
                {selectedRequest.price !== undefined && (
                  <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-slate-700 pt-2.5">
                    <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                      Amount
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      ₱{selectedRequest.price}
                    </span>
                  </div>
                )}
              </div>

              {/* Decline Reason Banner */}
              {selectedRequest.status === "cancelled" && selectedRequest.declineReason && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <h4 className="mb-1 text-xs font-black tracking-wider text-rose-800 uppercase">
                    Reason for Decline
                  </h4>
                  <p className="text-sm font-semibold text-rose-700">
                    {selectedRequest.declineReason}
                  </p>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 p-3.5 dark:border-gray-700">
                  <span className="mb-1 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Waste Type
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {selectedRequest.wasteType.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-100 p-3.5 dark:border-gray-700">
                  <span className="mb-1 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Volume
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {selectedRequest.volume}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-100 p-3.5 dark:border-gray-700">
                  <span className="mb-1 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Preferred Date
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {format(new Date(selectedRequest.preferredDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-100 p-3.5 dark:border-gray-700">
                  <span className="mb-1 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Submitted On
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {format(new Date(selectedRequest.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div>
                <span className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Pickup Address
                </span>
                <p className="rounded-xl border border-gray-100 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 p-3.5 text-sm leading-relaxed font-semibold text-gray-800 dark:text-gray-200">
                  {selectedRequest.pickupAddress}
                </p>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Additional Notes
                  </span>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 p-3.5 text-sm leading-relaxed font-semibold whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Uploaded Image & Proof Image */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {selectedRequest.photoUrl && (
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      Request Photo
                    </span>
                    <div className="h-36 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-slate-800">
                      <img
                        src={getImageUrl(selectedRequest.photoUrl)}
                        alt="Initial Request"
                        className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                        onClick={() => window.open(getImageUrl(selectedRequest.photoUrl), "_blank")}
                      />
                    </div>
                  </div>
                )}
                {selectedRequest.proofPhotoUrl && (
                  <div>
                    <span className="mb-1.5 block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                      Collection Proof
                    </span>
                    <div className="h-36 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-slate-800">
                      <img
                        src={getImageUrl(selectedRequest.proofPhotoUrl)}
                        alt="Collection Proof"
                        className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                        onClick={() =>
                          window.open(getImageUrl(selectedRequest.proofPhotoUrl), "_blank")
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Completed Details */}
              {selectedRequest.status === "completed" && selectedRequest.completedAt && (
                <div className="flex flex-col gap-1.5 rounded-2xl border border-emerald-100/50 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  <div className="flex justify-between">
                    <span>Collected On:</span>
                    <span className="font-bold">
                      {format(new Date(selectedRequest.completedAt), "MMM d, yyyy · h:mm a")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="dark:bg-slate-950/50 flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700">
              <Button
                onClick={() => {
                  setSelectedRequest(null);
                }}
                className="rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 font-bold text-white cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Location Picker Modal */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="max-w-xl rounded-2xl border-0 bg-white dark:bg-slate-900 p-5 shadow-2xl sm:max-w-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-black tracking-wider text-gray-900 dark:text-white uppercase">
              Pin Pickup Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 p-3">
              <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                Selected Address
              </span>
              <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isGeocoding ? (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
                    Fetching address details...
                  </span>
                ) : (
                  tempAddress || "Click anywhere on the map to pin your location"
                )}
              </p>
            </div>

            <div className="h-[400px] w-full overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 shadow-inner">
              <LocationPickerMapbox
                value={tempCoords}
                onChange={async (coords) => {
                  setTempCoords(coords);
                  setIsGeocoding(true);
                  try {
                    const result = await reverseGeocode(coords.lat, coords.lng);
                    if (result.display_name) {
                      setTempAddress(result.display_name);
                    }
                  } catch (error) {
                    console.error("Reverse geocode failed:", error);
                  } finally {
                    setIsGeocoding(false);
                  }
                }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowMapModal(false);
                }}
                className="flex-1 rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (tempCoords) {
                    setDetectedLat(tempCoords.lat);
                    setDetectedLng(tempCoords.lng);
                    setPickupAddress(tempAddress);
                    setShowMapModal(false);
                    toast.success("Location locked successfully!");
                  }
                }}
                disabled={!tempCoords || isGeocoding}
                className="flex-1 rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-black tracking-widest text-white uppercase hover:bg-black cursor-pointer"
              >
                Confirm Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
