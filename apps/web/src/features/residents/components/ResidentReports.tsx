"use client";

import { Camera, ChevronRight, Loader2, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReports, useCreateReport, useUploadReportImage } from "@/features/reports/hooks";
import { format } from "date-fns";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

function StatusBadge({ status }: { status: string }): React.ReactNode {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    "in-progress": "bg-blue-100 text-blue-700",
  };

  const labels: Record<string, string> = {
    pending: "Pending",
    resolved: "Resolved",
    "in-progress": "In Progress",
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

export default function ResidentReports(): React.ReactNode {
  const [type, setType] = useState<string>("");
  const [wasteType, setWasteType] = useState<string>("biodegradable");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("new-report");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: reports, isLoading } = useReports();
  const createReport = useCreateReport();
  const uploadImage = useUploadReportImage();

  const handleSubmit = () => {
    if (!type || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    createReport.mutate(
      {
        type: type as any,
        wasteType: wasteType as any,
        description,
        photoUrl: photoUrl || undefined,
      },
      {
        onSuccess: () => {
          setType("");
          setWasteType("biodegradable");
          setDescription("");
          setPhotoUrl(null);
          setActiveTab("history");
        },
      },
    );
  };

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
            onSuccess: (data) => {
              setPhotoUrl(data.url);
              toast.success("Image uploaded successfully");
            },
          },
        );
      } catch {
        toast.error("Failed to process image");
      }
    }
  };

  return (
    <div className="dark:bg-background flex h-full flex-col bg-[#F5F5F5] overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl p-4 pb-20 lg:p-6 lg:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-12 w-full rounded-none border-b border-gray-200 bg-transparent p-0 dark:border-gray-700">
            <TabsTrigger
              value="new-report"
              className="h-full flex-1 rounded-none border-b-2 border-transparent bg-transparent text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-[#111] data-[state=active]:text-[#111] data-[state=active]:shadow-none dark:data-[state=active]:text-white dark:data-[state=active]:border-white cursor-pointer"
            >
              NEW REPORT
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-full flex-1 rounded-none border-b-2 border-transparent bg-transparent text-sm font-bold text-gray-500 hover:text-gray-700 data-[state=active]:border-[#111] data-[state=active]:text-[#111] data-[state=active]:shadow-none dark:data-[state=active]:text-white dark:data-[state=active]:border-white cursor-pointer"
            >
              REPORT HISTORY
            </TabsTrigger>
          </TabsList>

          {/* New Report Form */}
          <TabsContent value="new-report" className="mt-0">
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
              <CardContent className="space-y-5 p-5 lg:p-8">
                {/* Report ID */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 dark:text-gray-350">
                    Report ID
                  </label>
                  <div className="dark:bg-slate-800 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-700">
                    Auto-generated on submission
                  </div>
                </div>

                {/* Report Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Report Type
                  </label>
                  <Select
                    value={type}
                    onValueChange={(val: string | null) => {
                      setType(val || "");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-medium">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="missed-pickup">Missed Pickup</SelectItem>
                      <SelectItem value="inaccessible-area">Inaccessible Area</SelectItem>
                      <SelectItem value="vehicle-problem">Vehicle Problem</SelectItem>
                      <SelectItem value="collection-delay">Collection Delay</SelectItem>
                      <SelectItem value="road-blockage">Road Blockage</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Waste Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Waste Type
                  </label>
                  <Select
                    value={wasteType}
                    onValueChange={(val: string | null) => {
                      setWasteType(val || "biodegradable");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg border-gray-200 bg-gray-50 dark:bg-slate-800 dark:border-slate-700 font-medium">
                      <SelectValue placeholder="Select Waste Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="biodegradable">Biodegradable</SelectItem>
                      <SelectItem value="non-biodegradable">Non-Biodegradable</SelectItem>
                      <SelectItem value="recyclable">Recyclable</SelectItem>
                      <SelectItem value="hazardous">Hazardous</SelectItem>
                      <SelectItem value="residual">Residual</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Description */}
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-widest text-gray-700 dark:text-gray-300 uppercase">
                    Reason / Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                    }}
                    placeholder="Provide a detailed description of the incident..."
                    className="min-h-[120px] resize-none rounded-xl border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4 text-sm font-medium focus:ring-1 focus:ring-[#0f2419]"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={createReport.isPending}
                    className="h-12 w-full rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-[#0f2419]/20 transition-all hover:bg-black cursor-pointer"
                  >
                    {createReport.isPending ? "SUBMITTING..." : "SUBMIT REPORT"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report History */}
          <TabsContent value="history" className="mt-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="mt-4 text-xs font-bold tracking-widest text-gray-400 uppercase">
                  Loading history...
                </p>
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="dark:bg-slate-900 dark:border-slate-800 overflow-hidden rounded-2xl border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      {report.photoUrl && (
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-800">
                          <img
                            src={getImageUrl(report.photoUrl)}
                            alt="Report"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {format(new Date(report.createdAt), "MMM d, yyyy")}
                          </p>
                          <span className="h-1 w-1 rounded-full bg-gray-200" />
                          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {format(new Date(report.createdAt), "h:mm a")}
                          </p>
                        </div>
                        <p className="mt-1 text-base font-black text-gray-900 dark:text-white capitalize">
                          {report.type.replaceAll("-", " ")}
                        </p>
                        <p className="mt-1 text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                          ID: {report.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-3">
                        <StatusBadge status={report.status} />
                        <button
                          type="button"
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-slate-800 text-gray-300">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="text-sm font-black text-gray-900 dark:text-white">No reports found</p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Your reporting history will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
