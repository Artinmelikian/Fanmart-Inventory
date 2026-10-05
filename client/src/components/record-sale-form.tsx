import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryItem } from "./inventory-table";
import { useState, useEffect } from "react";

const recordSaleSchema = z.object({
  itemId: z.string().min(1, "Please select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  description: z.string().optional(),
});

type RecordSaleFormValues = z.infer<typeof recordSaleSchema>;

interface RecordSaleFormProps {
  items: InventoryItem[];
  onSubmit: (data: RecordSaleFormValues) => void;
}

export function RecordSaleForm({ items, onSubmit }: RecordSaleFormProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [saleQuantity, setSaleQuantity] = useState<number>(0);

  const form = useForm<RecordSaleFormValues>({
    resolver: zodResolver(recordSaleSchema),
    defaultValues: {
      itemId: "",
      quantity: 0,
      description: "",
    },
  });

  const itemId = form.watch("itemId");
  const quantity = form.watch("quantity");

  useEffect(() => {
    if (itemId) {
      const item = items.find((i) => i.id.toString() === itemId);
      setSelectedItem(item || null);
    } else {
      setSelectedItem(null);
    }
  }, [itemId, items]);

  useEffect(() => {
    setSaleQuantity(Number(quantity) || 0);
  }, [quantity]);

  const remainingStock = selectedItem ? selectedItem.quantity - saleQuantity : 0;
  const isOverSelling = selectedItem && saleQuantity > selectedItem.quantity;

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Record Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="itemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Item *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-item">
                        <SelectValue placeholder="Choose an item..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} (Available: {item.quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedItem && (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Stock:</span>
                  <span className="font-mono font-semibold" data-testid="text-current-stock">
                    {selectedItem.quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Flow:</span>
                  <span className="font-mono">{selectedItem.flow} m³/h</span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity to Sell *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="0"
                      {...field}
                      data-testid="input-sale-quantity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., where the fan was sold or which project it went to..."
                      {...field}
                      data-testid="input-sale-description"
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedItem && saleQuantity > 0 && (
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Remaining Stock:</span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      isOverSelling ? "text-destructive" : "text-foreground"
                    }`}
                    data-testid="text-remaining-stock"
                  >
                    {remainingStock}
                  </span>
                </div>
                {isOverSelling && (
                  <p className="text-sm text-destructive">
                    Warning: Sale quantity exceeds available stock!
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!!isOverSelling}
                data-testid="button-record-sale"
              >
                Record Sale
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
