import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  deleteMe,
  deleteUser,
  getUser,
  listUsers,
  updateMe,
  updatePassword,
  updateUser,
} from "@/features/users/api";
import type { UpdatePasswordInput, UpdateUserInput, User } from "@/features/users/schemas";
import { useAuthStore } from "@/stores/auth-store";

const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
  me: () => [...usersKeys.all, "me"] as const,
};

export function useUsers(): UseQueryResult<User[]> {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: listUsers,
  });
}

export function useUser(id: string): UseQueryResult<User> {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: id.length > 0,
  });
}

export function useUpdateUser(id: string): UseMutationResult<User, Error, UpdateUserInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: (updated) => {
      qc.setQueryData(usersKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useUpdateMe(): UseMutationResult<User, Error, UpdateUserInput> {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  const currentUser = useAuthStore((s) => s.user);
  const rememberMeLoggedIn = useAuthStore((s) => s.rememberMeLoggedIn);

  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateMe(input),
    onSuccess: (updated) => {
      if (currentUser) {
        setSession(
          {
            ...currentUser,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phoneNumber: updated.phoneNumber || updated.contactNo,
            contactNo: updated.phoneNumber || updated.contactNo,
            address: updated.address
              ? {
                  line1: updated.address.line1,
                  barangay: updated.address.barangay,
                  city: updated.address.city,
                  province: updated.address.province,
                }
              : null,
            notificationPreferences: updated.notificationPreferences,
          },
          useAuthStore.getState().accessToken ?? "",
          rememberMeLoggedIn,
        );
      }

      qc.setQueryData(usersKeys.me(), updated);
      void qc.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useUpdatePassword(id: string): UseMutationResult<void, Error, UpdatePasswordInput> {
  return useMutation({
    mutationFn: (input: UpdatePasswordInput) => updatePassword(id, input),
  });
}

export function useDeleteUser(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: usersKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useDeleteMyAccount(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      clear();
      qc.clear();
      globalThis.location.href = "/login";
    },
  });
}
