"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Bell, Monitor, Camera, ShieldCheck, Truck, LogOut, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuthStore } from "@/stores/auth-store";
import { useUpdateMe, useUpdatePassword } from "@/features/users/hooks";
import {
  updateUserSchema,
  updatePasswordSchema,
  type UpdateUserInput,
  type UpdatePasswordInput,
} from "@/features/users/schemas";

export default function EcoAideSettings(): React.ReactNode {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clear);
  const updateMe = useUpdateMe();
  const updatePassword = useUpdatePassword(user?.id ?? "");
  const { theme, setTheme } = useTheme();

  const profileForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
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
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = (data: UpdateUserInput) => {
    updateMe.mutate(data, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: (err: any) => toast.error(err.message || "Failed to update profile"),
    });
  };

  const onPasswordSubmit = (data: UpdatePasswordInput) => {
    updatePassword.mutate(data, {
      onSuccess: () => {
        toast.success("Password updated successfully");
        passwordForm.reset();
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update password");
      },
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

  const prefs = user?.notificationPreferences ?? {
    emailNotif: true,
    pushNotif: true,
    collectionReminder: true,
    statusUpdates: false,
  };

  return (
    <div className="min-h-full bg-[#F5F5F5] dark:bg-background p-4 pb-24 transition-colors lg:p-8 lg:pb-8 overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Manage your profile and system preferences.
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

          {/* Account Tab */}
          <TabsContent value="account" className="mt-0 space-y-6">
            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="space-y-8 p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-gray-50 dark:border-slate-805 shadow-md">
                      <AvatarFallback className="bg-gray-100 text-xl font-black text-gray-400 dark:bg-slate-950">
                        {user ? `${user.firstName[0]}${user.lastName[0]}` : "JD"}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute right-0 bottom-0 h-8 w-8 rounded-full border border-gray-100 bg-white text-[#0f2419] shadow-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="mb-2 text-xl leading-none font-black text-gray-900 dark:text-white">
                      Profile Information
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Update your account details and profile picture.
                    </p>
                  </div>
                </div>

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-900 dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          Email Address
                        </Label>
                        <Input
                          value={user?.email || ""}
                          disabled
                          className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={updateMe.isPending}
                      className="h-11 rounded-xl bg-[#0f2419] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-[#0f2419]/20 hover:bg-[#0f2419]/90 cursor-pointer"
                    >
                      {updateMe.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-0 bg-[#0f2419] dark:bg-[#11241a] text-white shadow-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/50">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg leading-none font-black tracking-widest uppercase">
                    Eco Aide Details
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Agency ID
                    </p>
                    <p className="text-sm font-black text-white">
                      {user?.id?.slice(0, 8).toUpperCase() || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Vehicle Unit
                    </p>
                    <p className="text-sm font-black text-white">BT-04</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                      Rank Status
                    </p>
                    <p className="flex items-center gap-1.5 text-sm font-black tracking-widest text-emerald-400 uppercase">
                      <ShieldCheck className="h-4 w-4" />
                      Active EcoAide
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="p-8">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-850 text-gray-400 dark:text-gray-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg leading-none font-black text-gray-900 dark:text-white">
                    Security
                  </h3>
                </div>

                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                              Current Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold dark:text-white"
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
                          <FormItem className="space-y-2">
                            <FormLabel className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                              New Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Min. 8 characters"
                                className="h-11 rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold dark:text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={updatePassword.isPending}
                      className="h-11 rounded-xl bg-gray-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-black cursor-pointer"
                    >
                      {updatePassword.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  clearSession();
                }}
                className="h-12 gap-2 rounded-2xl px-8 text-xs font-black tracking-widest text-red-500 uppercase transition-all hover:bg-red-50 hover:text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout System
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-0">
            <Card className="overflow-hidden rounded-3xl border-0 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <CardContent className="space-y-8 p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                    <Bell className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl leading-none font-black text-gray-900 dark:text-white">
                      Notification Preferences
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Choose how you want to be notified.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: "emailNotif",
                      title: "Email Notifications",
                      desc: "Receive report updates via your email.",
                    },
                    {
                      id: "pushNotif",
                      title: "Push Notifications",
                      desc: "Enable push notifications for urgent alerts.",
                    },
                    {
                      id: "collectionReminder",
                      title: "Collection Reminders",
                      desc: "Get notified when a route is assigned.",
                    },
                    {
                      id: "statusUpdates",
                      title: "Request/Report Status Updates",
                      desc: "Receive status updates on active tasks.",
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between rounded-2xl border border-transparent bg-gray-50/50 dark:bg-slate-950 p-4 transition-all hover:border-gray-100 dark:hover:border-slate-800"
                    >
                      <div>
                        <h4 className="mb-1 text-sm leading-none font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          {item.desc}
                        </p>
                      </div>
                      <Switch
                        checked={prefs[item.id as keyof typeof prefs]}
                        onCheckedChange={(checked: boolean) => {
                          onTogglePref(item.id as any, checked);
                        }}
                        className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="mt-0">
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
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Customize your interface and theme.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-850 text-[#0f2419] dark:text-white shadow-sm">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="mb-0.5 text-sm leading-none font-bold tracking-widest text-gray-900 uppercase dark:text-white">
                        Dark Mode
                      </h4>
                      <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-550">
                        Dark theme for the dashboard
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked: boolean) => {
                      setTheme(checked ? "dark" : "light");
                    }}
                    className="data-[state=checked]:bg-[#0f2419] dark:data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black tracking-[0.3em] text-gray-300 uppercase">
            Bazoora v2.0.42-Stable
          </p>
        </div>
      </div>
    </div>
  );
}
