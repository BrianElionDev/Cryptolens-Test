import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface RefreshAllResponse {
  status: "success" | "partial_success";
  message: string;
  data: {
    operations: string[];
    results: Record<string, "success" | "error">;
    errors: number;
    timestamp: string;
  };
}

interface RefreshAllError {
  error?: string;
  detail?: string;
}

export function useRefreshAll() {
  const queryClient = useQueryClient();

  return useMutation<RefreshAllResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/v1/account/refresh-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData: RefreshAllError = await response.json().catch(() => ({
          error: `Request failed with status ${response.status}`,
        }));

        throw new Error(errorData.error || errorData.detail || "Refresh failed");
      }

      const data: RefreshAllResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success(data.message || "All account data refreshed successfully");
      } else if (data.status === "partial_success") {
        const successCount =
          data.data.operations.length - data.data.errors;
        const failedOperations = Object.entries(data.data.results)
          .filter(([_, status]) => status === "error")
          .map(([operation]) => operation);

        const message = `${data.message}\n${successCount} of ${data.data.operations.length} operations succeeded.${failedOperations.length > 0 ? ` Failed: ${failedOperations.join(", ")}` : ""}`;

        toast(message, {
          icon: "⚠️",
          duration: 5000,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
      queryClient.invalidateQueries({ queryKey: ["pnl-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to refresh account data");
    },
  });
}
