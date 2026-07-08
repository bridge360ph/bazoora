"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Bell, Settings as SettingsIcon, LogOut, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAuthStore } from "@/stores/auth-store";
import { useUpdateMe, useUpdatePassword, useDeleteMyAccount } from "@/features/users/hooks";
import {
  updateUserSchema,
  updatePasswordSchema,
  type UpdateUserInput,
  type UpdatePasswordInput,
} from "@/features/users/schemas";
import { capitalizeNameValue } from "@/features/auth/formatters";

export default function ResidentSettings(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const updateMe = useUpdateMe();
  const updatePassword = useUpdatePassword(user?.id ?? "");
  const deleteAccount = useDeleteMyAccount();
  const { theme, setTheme } = useTheme();
  const [line1, setLine1] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ code: string; name: string }[]>([]);
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
    },
  });

  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: capitalizeNameValue(user.firstName),
        lastName: capitalizeNameValue(user.lastName),
        phoneNumber: user.contactNo
          ? user.contactNo
              .replaceAll(/\D/g, "")
              .replace(/^63/, "")
              .replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
          : "",
        address: user.address
          ? `${user.address.line1}, ${user.address.barangay}, ${user.address.city}, ${user.address.province}`
          : "",
      });
      setLine1(user.address?.line1 ?? "");
      setBarangay(user.address?.barangay ?? "");
      setCity(user.address?.city ?? "");
      setProvince(user.address?.province ?? "");

      if (user.notificationPreferences?.isDarkMode !== undefined) {
        setTheme(user.notificationPreferences.isDarkMode ? "dark" : "light");
      }
    }
  }, [user]);

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((r) => r.json())
      .then((data: { code: string; name: string }[]) => {
        setProvinces(data.toSorted((a, b) => a.name.localeCompare(b.name)));
      });
  }, []);

  useEffect(() => {
    if (provinces.length === 0 || !province) return;

    if (province.toLowerCase().includes("metro manila") || province === "Metro Manila") {
      setProvinceCode("130000000");
      return;
    }

    const match = provinces.find((p) => p.name.toLowerCase() === province.toLowerCase());
    if (match) setProvinceCode(match.code);
  }, [provinces, province]);

  useEffect(() => {
    if (!provinceCode) {
      setCities([]);
      return;
    }
    const url =
      provinceCode === "130000000"
        ? "https://psgc.gitlab.io/api/regions/130000000/cities-municipalities/"
        : `https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`;
    fetch(url)
      .then((r) => r.json())
      .then((data: { code: string; name: string }[]) => {
        setCities(data.toSorted((a, b) => a.name.localeCompare(b.name)));
      });
  }, [provinceCode]);

  useEffect(() => {
    if (cities.length === 0 || !city) return;

    const match = cities.find((c) => c.name.toLowerCase() === city.toLowerCase());
    if (match) setCityCode(match.code);
  }, [cities, city]);

  useEffect(() => {
    if (!cityCode) {
      setBarangays([]);
      return;
    }
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`)
      .then((r) => r.json())
      .then((data: { code: string; name: string }[]) => {
        setBarangays(data.toSorted((a, b) => a.name.localeCompare(b.name)));
      });
  }, [cityCode]);

  const onProfileSubmit = (data: UpdateUserInput) => {
    const values = {
      firstName: data.firstName,
      lastName: data.lastName,
      contactNo: data.phoneNumber ? `+63${data.phoneNumber.replaceAll(/\D/g, "")}` : undefined,
      address: {
        line1,
        barangay,
        city,
        province,
      },
    };

    updateMe.mutate(values as any, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: (err: any) => {
        toast.error(err.message || "Failed to update profile");
      },
    });
  };

  const onPasswordSubmit = (data: UpdatePasswordInput) => {
    updatePassword.mutate(data, {
      onSuccess: () => {
        toast.success("Password updated successfully");
        passwordForm.reset();
      },
      onError: (err: Error) => toast.error(err.message || "Failed to update password"),
    });
  };

  const onTogglePref = (
    key: "emailNotif" | "pushNotif" | "collectionReminder" | "statusUpdates",
    checked: boolean,
  ) => {
    if (!user) return;
    const newPrefs = {
      ...user.notificationPreferences,
      [key]: checked,
    };
    updateMe.mutate(
      { notificationPreferences: newPrefs },
      {
        onSuccess: () => toast.success("Preference updated"),
        onError: () => toast.error("Failed to update preference"),
      },
    );
  };

  const notifPrefs = user?.notificationPreferences ?? {
    emailNotif: true,
    pushNotif: true,
    collectionReminder: true,
    statusUpdates: false,
  };

  return (
    <div className="dark:bg-background flex h-full flex-col bg-[#F5F5F5] transition-colors overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl p-4 pb-20 lg:p-8 lg:pb-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

        <Tabs defaultValue="account" className="flex w-full flex-col items-center gap-8">
          <TabsList className="dark:bg-slate-900 flex h-auto w-fit items-center gap-1 rounded-xl bg-gray-150 p-1">
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-gray-500 shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white cursor-pointer"
            >
              <User className="h-4 w-4" /> Account
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-gray-500 shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white cursor-pointer"
            >
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold text-gray-500 shadow-none transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white cursor-pointer"
            >
              <SettingsIcon className="h-4 w-4" /> System
            </TabsTrigger>
          </TabsList>

          <div className="w-full min-w-0">
            <TabsContent value="account" className="mt-0">
              <div className="space-y-6">
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f5ee] text-[#0f2419]">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          Profile Information
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Update your account details
                        </p>
                      </div>
                    </div>

                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                        className="space-y-5"
                      >
                        <div className="grid gap-5 sm:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-305">
                                  First Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="dark:bg-slate-850 h-11 rounded-lg border-gray-200 bg-gray-50 font-medium dark:border-gray-700"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-305">
                                  Last Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="dark:bg-slate-850 h-11 rounded-lg border-gray-200 bg-gray-50 font-medium dark:border-gray-700"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Email Address
                          </label>
                          <Input
                            value={user?.email ?? ""}
                            disabled
                            className="dark:bg-slate-800 h-11 w-full rounded-lg border-gray-200 bg-gray-100 font-medium text-gray-500 dark:border-gray-700 cursor-not-allowed"
                          />
                        </div>

                        <FormField
                          control={profileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <span className="dark:bg-slate-800 inline-flex h-11 items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-100 px-3 text-sm font-medium text-gray-500 dark:border-gray-700">
                                    +63
                                  </span>
                                  <Input
                                    value={field.value ?? ""}
                                    placeholder="9XX XXX XXXX"
                                    maxLength={12}
                                    className="dark:bg-slate-850 h-11 rounded-l-none rounded-r-lg border-gray-200 bg-gray-50 font-medium dark:border-gray-700"
                                    onChange={(e) => {
                                      const digits = e.target.value
                                        .replaceAll(/\D/g, "")
                                        .slice(0, 10);
                                      let formatted = digits;
                                      if (digits.length > 6)
                                        formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                                      else if (digits.length > 3)
                                        formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;
                                      field.onChange({ target: { value: formatted } });
                                    }}
                                    onBlur={() => {
                                      const digits = (field.value ?? "").replaceAll(/\D/g, "");
                                      if (digits.length > 0 && digits.length < 10) {
                                        profileForm.setError("phoneNumber", {
                                          message: "Enter exactly 10 mobile digits",
                                        });
                                      } else {
                                        profileForm.clearErrors("phoneNumber");
                                      }
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Address
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="dark:bg-slate-800 flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700">
                              <select
                                value={provinceCode}
                                onChange={(e) => {
                                  setProvinceCode(e.target.value);
                                  setProvince(e.target.options[e.target.selectedIndex]?.text ?? "");
                                  setCityCode("");
                                  setCity("");
                                  setBarangay("");
                                }}
                                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none dark:text-gray-350"
                              >
                                <option value="" className="dark:bg-slate-900">Province</option>
                                <option value="130000000" className="dark:bg-slate-900">Metro Manila</option>
                                {provinces.map((p) => (
                                  <option key={p.code} value={p.code} className="dark:bg-slate-900">
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dark:bg-slate-800 flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700">
                              <select
                                value={cityCode}
                                onChange={(e) => {
                                  setCityCode(e.target.value);
                                  setCity(e.target.options[e.target.selectedIndex]?.text ?? "");
                                  setBarangay("");
                                }}
                                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none dark:text-gray-350"
                              >
                                <option value="" className="dark:bg-slate-900">City/Municipality</option>
                                {cities.map((c) => (
                                  <option key={c.code} value={c.code} className="dark:bg-slate-900">
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dark:bg-slate-800 flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700">
                              <select
                                value={barangay}
                                onChange={(e) => {
                                  setBarangay(e.target.value);
                                }}
                                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none dark:text-gray-355"
                              >
                                <option value="" className="dark:bg-slate-900">Barangay</option>
                                {barangays.map((b) => (
                                  <option key={b.code} value={b.name} className="dark:bg-slate-900">
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dark:bg-slate-800 flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700">
                              <input
                                value={line1}
                                onChange={(e) => {
                                  setLine1(e.target.value);
                                }}
                                placeholder="House No., Building, Street Name"
                                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-300"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-start lg:justify-end">
                          <Button
                            type="submit"
                            disabled={updateMe.isPending}
                            className="h-11 w-full rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-8 font-bold text-white hover:bg-black lg:w-auto cursor-pointer"
                          >
                            {updateMe.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          Security
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Manage your password and security settings
                        </p>
                      </div>
                    </div>

                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className="space-y-5"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-305">
                                Current Password
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="Enter current password"
                                  className="dark:bg-slate-850 h-11 rounded-lg border-gray-200 bg-gray-50 dark:border-gray-700"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-gray-700 dark:text-gray-305">
                                New Password
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="Enter new password"
                                  className="dark:bg-slate-850 h-11 rounded-lg border-gray-200 bg-gray-50 dark:border-gray-700"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="mt-8 flex justify-start lg:justify-end">
                          <Button
                            type="submit"
                            disabled={updatePassword.isPending}
                            className="h-11 w-full rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-8 font-bold text-white hover:bg-black lg:w-auto cursor-pointer"
                          >
                            {updatePassword.isPending ? "Updating..." : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-4 pt-4 lg:flex-row">
                  <Button
                    variant="outline"
                    className="h-12 w-full flex-1 rounded-xl border-gray-200 font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      clearSession();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Log Out
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 w-full flex-1 rounded-xl border-red-100 bg-red-55 font-bold text-red-600 hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-500 cursor-pointer"
                    onClick={() => {
                      if (
                        confirm(
                          "Are you sure you want to delete your account? This action cannot be undone.",
                        )
                      ) {
                        deleteAccount.mutate();
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
                <CardContent className="p-6 lg:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Notification Preferences
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Choose how you want to be notified
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Email Notifications
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Receive an email updates about reports and issues
                        </p>
                      </div>
                      <Switch
                        checked={notifPrefs.emailNotif}
                        onCheckedChange={(c: boolean) => {
                          onTogglePref("emailNotif", c);
                        }}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <Separator className="bg-gray-100 dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Push Notifications
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Receive push notifications for urgent alerts
                        </p>
                      </div>
                      <Switch
                        checked={notifPrefs.pushNotif}
                        onCheckedChange={(c: boolean) => {
                          onTogglePref("pushNotif", c);
                        }}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <Separator className="bg-gray-100 dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Collection Reminders
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Receive reminders about next collection
                        </p>
                      </div>
                      <Switch
                        checked={notifPrefs.collectionReminder}
                        onCheckedChange={(c: boolean) => {
                          onTogglePref("collectionReminder", c);
                        }}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                    <Separator className="bg-gray-100 dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Request/Report Status Updates
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Receive status updates about sent report or request
                        </p>
                      </div>
                      <Switch
                        checked={notifPrefs.statusUpdates}
                        onCheckedChange={(c: boolean) => {
                          onTogglePref("statusUpdates", c);
                        }}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl border-0 bg-white shadow-sm">
                <CardContent className="p-6 lg:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white">
                      <SettingsIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Appearance
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Customize the look and feel
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Dark Mode</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Use dark theme for the panel
                      </p>
                    </div>
                    <Switch
                      checked={mounted && theme === "dark"}
                      onCheckedChange={(checked: boolean) => {
                        setTheme(checked ? "dark" : "light");
                        updateMe.mutate({ isDarkMode: checked } as any);
                      }}
                      className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
