import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import type { Sale } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

const editSaleSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  description: z.string().trim().min(1, "Description is required"),
});

type EditSaleFormValues = z.infer<typeof editSaleSchema>;

interface EditSaleDialogProps {
  sale: Sale | null;
  onClose: () => void;
}

function EditSaleForm({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const { toast } = useToast();

  const form = useForm<EditSaleFormValues>({
    resolver: zodResolver(editSaleSchema),
    defaultValues: {
      quantity: sale.quantitySold,
      description: sale.description ?? "",
    },
  });

  const updateSaleMutation = useMutation({
    mutationFn: async (data: EditSaleFormValues) => {
      return await apiRequest("PATCH", `/api/sales/${sale.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Success",
        description: "Sale updated successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sale.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => updateSaleMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Sold *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  data-testid="input-edit-sale-quantity"
                />
              </FormControl>
              <FormDescription>
                Changing this adjusts the item's stock in inventory.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., where the fan was sold or which project it went to..."
                  {...field}
                  data-testid="input-edit-sale-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-edit-sale"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateSaleMutation.isPending}
            data-testid="button-save-edit-sale"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function EditSaleDialog({ sale, onClose }: EditSaleDialogProps) {
  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sale</DialogTitle>
          <DialogDescription>
            {sale ? `Update the sale of "${sale.itemName}".` : ""}
          </DialogDescription>
        </DialogHeader>
        {sale && <EditSaleForm key={sale.id} sale={sale} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
