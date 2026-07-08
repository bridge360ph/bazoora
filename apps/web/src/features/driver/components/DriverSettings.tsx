"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { useChangePassword } from "@/features/auth/hooks";
import { useUpdateMe } from "@/features/users/hooks";
import { changePasswordFormSchema, type ChangePasswordFormValues } from "@/features/auth/schemas";
import { toast } from "sonner";
import { capitalizeNameValue } from "@/features/auth/formatters";

import {
  Bell,
  Camera,
  LogOut,
  MapPinned,
  Monitor,
  Moon,
  ShieldCheck,
  Truck,
  User,
  Radio,
} from "lucide-react";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  contactNo: z
    .string()
    .trim()
    .regex(/^(\+63|0)9\d{9}$/, "Enter a valid PH mobile number")
    .nullable()
    .optional(),
  address: z.string().trim().min(1).max(255).nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function formatAddress(
  address: { line1: string; barangay: string; city: string; province: string } | null | undefined,
): string {
  if (!address) return "";
  return [address.line1, address.barangay, address.city, address.province]
    .filter(Boolean)
    .join(", ");
}

export default function DriverSettings(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const updateMe = useUpdateMe();
  const changePasswordMutation = useChangePassword();

  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "DR";

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: capitalizeNameValue(user?.firstName ?? ""),
      lastName: capitalizeNameValue(user?.lastName ?? ""),
      contactNo: user?.phoneNumber ?? "",
      address: formatAddress(user?.address),
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateMe.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.contactNo || undefined,
        address: values.address || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
        },
        onError: (error: any) => {
          toast.error(error instanceof Error ? error.message : "Failed to update profile.");
        },
      },
    );
  });

  const onPasswordSubmit = passwordForm.handleSubmit((values) => {
    changePasswordMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated successfully");
        passwordForm.reset();
      },
      onError: (error: any) => {
        toast.error(error instanceof Error ? error.message : "Could not update password.");
      },
    });
  });

  return (
    <div className="min-h-full bg-[#F5F5F5] dark:bg-background p-4 pb-24 lg:p-8 lg:pb-8 overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Driver Settings</h2>
          <p className="text-sm font-medium text-gray-500">
            Manage your driver profile, route preferences, and truck system settings.
          </p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="mb-8 grid h-14 w-full grid-cols-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
            <TabsTrigger
              value="account"
              className="rounded-xl text-xs font-bold tracking-widest uppercase transition-all data-[state=active]:bg-[#0f2419] dark:data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-xl text-xs font-bold tracking-widest uppercase transition-all data-[state=active]:bg-[#0f2419] dark:data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="rounded-xl text-xs font-bold tracking-widest uppercase transition-all data-[state=active]:bg-[#0f2419] dark:data-[state=active]:bg-emerald-600 data-[state=active]:text-white cursor-pointer"
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* ACCOUNT TAB */}
          <TabsContent value="account" className="mt-0 space-y-6">
            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="space-y-8 p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-gray-50 dark:border-slate-800 shadow-md">
                      <AvatarFallback className="bg-[#0f2419] text-xl font-black text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute right-0 bottom-0 h-8 w-8 rounded-full border border-gray-100 bg-white text-[#0f2419] shadow-lg hover:bg-gray-55 cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="mb-2 text-xl leading-none font-black text-gray-900 dark:text-white">
                      Driver Profile
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      Update your personal details and assigned vehicle information.
                    </p>
                  </div>
                </div>

                <form onSubmit={onSubmit}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        First Name
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
                        {...form.register("firstName")}
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-xs text-red-650">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Last Name
                      </Label>
                      <Input
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
                        {...form.register("lastName")}
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-xs text-red-655">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Email Address
                      </Label>
                      <Input
                        type="email"
                        disabled
                        value={user?.email ?? ""}
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Phone Number
                      </Label>
                      <Input
                        type="tel"
                        placeholder="+63 9XX XXX XXXX"
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
                        {...form.register("contactNo")}
                      />
                      {form.formState.errors.contactNo && (
                        <p className="text-xs text-red-660">
                          {form.formState.errors.contactNo.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Assigned Route
                      </Label>
                      <Input
                        disabled
                        placeholder="General Trias Sector A"
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white opacity-60 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        Address
                      </Label>
                      <Input
                        placeholder="Street, Barangay, City/Municipality, Province"
                        className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
                        {...form.register("address")}
                      />
                      {form.formState.errors.address && (
                        <p className="text-xs text-red-665">
                          {form.formState.errors.address.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={updateMe.isPending}
                      className="h-11 rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-[#0f2419]/20 hover:bg-[#0f2419]/90 cursor-pointer"
                    >
                      {updateMe.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Driver Info */}
            <Card className="overflow-hidden rounded-3xl border-0 bg-[#0f2419] dark:bg-[#11241a] text-white shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/50">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg leading-none font-black tracking-widest uppercase">
                    Driver Assignment
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Driver ID
                    </p>
                    <p className="text-sm font-black text-white">DRV-2034</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Truck ID
                    </p>
                    <p className="text-sm font-black text-white">BT-04</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Shift
                    </p>
                    <p className="text-sm font-black text-white">Morning Shift</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Status
                    </p>
                    <p className="flex items-center gap-1.5 text-sm font-black tracking-widest text-emerald-400 uppercase">
                      <ShieldCheck className="h-4 w-4" />
                      Active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-850 text-gray-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg leading-none font-black text-gray-900 dark:text-white">Security</h3>
                </div>
                <form onSubmit={onPasswordSubmit}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          Current Password
                        </Label>
                        <Input
                          type="password"
                          className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold dark:text-white"
                          {...passwordForm.register("currentPassword")}
                        />
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-xs text-red-650">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          New Password
                        </Label>
                        <Input
                          type="password"
                          placeholder="Min. 8 characters"
                          className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold dark:text-white"
                          {...passwordForm.register("newPassword")}
                        />
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-xs text-red-655">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          Confirm New Password
                        </Label>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold dark:text-white"
                          {...passwordForm.register("confirmPassword")}
                        />
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-xs text-red-660">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="h-11 rounded-xl bg-gray-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-black cursor-pointer"
                    >
                      {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="mt-0">
            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="space-y-8 p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-slate-850 text-emerald-600 dark:text-emerald-450">
                    <Bell className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl leading-none font-black text-gray-900 dark:text-white">
                      Notification Preferences
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      Configure route alerts and operational updates.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      title: "Route Assignment Alerts",
                      desc: "Receive updates when routes are assigned.",
                      active: true,
                    },
                    {
                      title: "GPS Tracking Alerts",
                      desc: "Notifications when GPS disconnects.",
                      active: true,
                    },
                    {
                      title: "Dispatch Messages",
                      desc: "Receive urgent dispatch instructions.",
                      active: true,
                    },
                    {
                      title: "Breakdown & Emergency Alerts",
                      desc: "Critical truck issue notifications.",
                      active: true,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between rounded-2xl border border-transparent bg-gray-50/50 dark:bg-slate-950 p-4 transition-all hover:border-gray-100 dark:hover:border-slate-800"
                    >
                      <div>
                        <h4 className="mb-1 text-sm leading-none font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-medium text-gray-500">{item.desc}</p>
                      </div>
                      <Switch
                        defaultChecked={item.active}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
                <Button className="h-12 rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-8 text-xs font-black tracking-widest text-white uppercase shadow-lg shadow-[#0f2419]/20 hover:bg-[#0f2419]/90 cursor-pointer">
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SYSTEM TAB */}
          <TabsContent value="system" className="mt-0">
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <CardContent className="space-y-8 p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white">
                      <Monitor className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-xl leading-none font-black text-gray-900 dark:text-white">
                        System Appearance
                      </h3>
                      <p className="text-sm font-medium text-gray-500">
                        Customize your dashboard experience.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-850 text-[#0f2419] dark:text-white shadow-sm">
                        <Moon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="mb-0.5 text-sm leading-none font-bold tracking-widest text-gray-900 dark:text-white uppercase">
                          Dark Mode
                        </h4>
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                          Dark theme for night operations
                        </p>
                      </div>
                    </div>
                    <Switch className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-850 text-blue-600 dark:text-blue-400">
                      <Radio className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Truck Systems</h3>
                  </div>
                  {[
                    {
                      icon: Truck,
                      title: "Live GPS Tracking",
                      desc: "Enable truck location sharing",
                    },
                    {
                      icon: MapPinned,
                      title: "Auto Route Sync",
                      desc: "Automatically sync assigned routes",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-850 shadow-sm">
                          <item.icon className="h-5 w-5 text-[#0f2419] dark:text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-[11px] text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 flex flex-col items-center gap-6">
          <Button
            variant="ghost"
            className="h-12 gap-2 rounded-2xl px-8 text-xs font-black tracking-widest text-red-500 uppercase transition-all hover:bg-red-50 hover:text-red-650 cursor-pointer"
            onClick={() => {
              clearSession();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout System
          </Button>
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-300 uppercase">
            Bazoora Driver Console v2.0.42
          </p>
        </div>
      </div>
    </div>
  );
}
