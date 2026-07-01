import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading: isLoadingUser,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const {
    data: mySchool,
    isLoading: isLoadingSchool,
  } = trpc.school.getMySchool.useQuery(undefined, {
    enabled: !!user && user.role !== "admin",
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      window.location.reload();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAdmin: user?.role === "admin",
      isPrincipal: user?.role === "user" && !!mySchool,
      school: mySchool ?? null,
      isAuthenticated: !!user,
      isLoading: isLoadingUser || isLoadingSchool || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, mySchool, isLoadingUser, isLoadingSchool, logoutMutation.isPending, error, logout, refetch]
  );
}
