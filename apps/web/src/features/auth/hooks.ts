import {
  useMutation,
  type UseMutationResult,
} from "@tanstack/react-query";

import {
  login,
  logout,
  register,
  changePassword,
} from "@/features/auth/api";
import type {
  AuthResponse,
  GenericSuccessResponseData,
  LoginInput,
  RegisterInput,
  ChangePasswordFormValues,
} from "@/features/auth/schemas";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin(): UseMutationResult<AuthResponse["data"], Error, LoginInput> {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
    },
  });
}

export function useRegister(): UseMutationResult<AuthResponse["data"], Error, RegisterInput> {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
    },
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clear();
    },
  });
}

export function useChangePassword(): UseMutationResult<
  GenericSuccessResponseData,
  Error,
  ChangePasswordFormValues
> {
  return useMutation({
    mutationFn: (input: ChangePasswordFormValues) => changePassword(input),
  });
}
