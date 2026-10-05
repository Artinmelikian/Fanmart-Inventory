import { RecordSaleForm } from "@/components/record-sale-form";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Item } from "@shared/schema";

export default function RecordSale() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  const recordSaleMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantity: number; description?: string }) => {
      return await apiRequest("POST", "/api/sales", {
        itemId: parseInt(data.itemId),
        quantity: data.quantity,
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Success",
        description: "Sale recorded successfully.",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    recordSaleMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Record Sale</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record a sale and update inventory quantities
        </p>
      </div>

      <RecordSaleForm items={items} onSubmit={handleSubmit} />
    </div>
  );
}
