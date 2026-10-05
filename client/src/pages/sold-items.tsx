import { useQuery, useMutation } from "@tanstack/react-query";
import type { Sale } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Package, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function SoldItems() {
  const { toast } = useToast();
  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const returnSaleMutation = useMutation({
    mutationFn: async (saleId: number) => {
      return await apiRequest("POST", `/api/sales/${saleId}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item returned",
        description: "The sold item has been returned to inventory",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return item",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading sales history...</p>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Sold Items</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your complete sales history
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No sales recorded yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sales will appear here once you start recording them
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Sold Items</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your complete sales history with {sales.length} sale{sales.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>
            All recorded sales sorted by date (newest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Flow (m³/h)</TableHead>
                  <TableHead className="text-right">Power (W)</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Speed (rpm)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-date-${sale.id}`}>
                      {format(new Date(sale.saleDate), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-itemname-${sale.id}`}>
                      {sale.itemName}
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal break-words text-sm" data-testid={`text-description-${sale.id}`}>
                      {sale.description || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-quantity-${sale.id}`}>
                      {sale.quantitySold}
                    </TableCell>
                    <TableCell className="text-right font-mono" data-testid={`text-flow-${sale.id}`}>
                      {sale.flow}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground" data-testid={`text-power-${sale.id}`}>
                      {sale.power ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground" data-testid={`text-weight-${sale.id}`}>
                      {sale.weight ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground" data-testid={`text-speed-${sale.id}`}>
                      {sale.speed ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`button-return-${sale.id}`}
                            disabled={returnSaleMutation.isPending}
                          >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Return
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Return this item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will return {sale.quantitySold} unit{sale.quantitySold !== 1 ? 's' : ''} of "{sale.itemName}" back to your inventory. 
                              The sale record will be removed from your sales history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-return-${sale.id}`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => returnSaleMutation.mutate(sale.id)}
                              data-testid={`button-confirm-return-${sale.id}`}
                            >
                              Return to Inventory
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
