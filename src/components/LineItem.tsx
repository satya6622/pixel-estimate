import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface LineItemData {
  id: string;
  description: string;
  features: string;
  quantity: number;
  price: number;
  deliveryFee: number;
  cornerCutting: number;
}

interface LineItemProps {
  item: LineItemData;
  onChange: (id: string, field: keyof LineItemData, value: string | number) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const LineItem = ({ item, onChange, onRemove, canRemove }: LineItemProps) => {
  const subtotal = item.quantity * item.price;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 items-start py-2">
        <div className="col-span-12 md:col-span-5 space-y-2">
          <Input
            placeholder="Item description"
            value={item.description}
            onChange={(e) => onChange(item.id, "description", e.target.value)}
            className="w-full"
          />
          <Input
            placeholder="Features (e.g., 300 GSM, Round edge, Glossy)"
            value={item.features}
            onChange={(e) => onChange(item.id, "features", e.target.value)}
            className="w-full text-sm"
          />
        </div>
        <div className="col-span-4 md:col-span-2">
          <Input
            type="number"
            min="0"
            step="1"
            placeholder="Qty"
            value={item.quantity || ""}
            onChange={(e) => onChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>
        <div className="col-span-4 md:col-span-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Rate"
            value={item.price || ""}
            onChange={(e) => onChange(item.id, "price", parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>
        <div className="col-span-3 md:col-span-2 text-right font-semibold pt-2">
          ₹{subtotal.toFixed(2)}
        </div>
        <div className="col-span-1 md:col-span-1 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            disabled={!canRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Delivery Fee Input - Separate Row */}
      <div className="grid grid-cols-12 gap-4 items-center py-2 bg-muted/30 rounded-md px-4">
        <div className="col-span-12 md:col-span-3">
          <label className="text-sm font-medium text-muted-foreground">
            Delivery Fee Amount:
          </label>
        </div>
        <div className="col-span-8 md:col-span-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={item.deliveryFee || ""}
            onChange={(e) => onChange(item.id, "deliveryFee", parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>
        <div className="col-span-4 md:col-span-6"></div>
      </div>

      {/* Corner Cutting Input - Separate Row */}
      <div className="grid grid-cols-12 gap-4 items-center py-2 bg-muted/30 rounded-md px-4">
        <div className="col-span-12 md:col-span-3">
          <label className="text-sm font-medium text-muted-foreground">
            Corner Cutting Amount:
          </label>
        </div>
        <div className="col-span-8 md:col-span-3">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={item.cornerCutting || ""}
            onChange={(e) => onChange(item.id, "cornerCutting", parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>
        <div className="col-span-4 md:col-span-6"></div>
      </div>
    </div>
  );
};
