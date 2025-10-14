import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LineItem, LineItemData } from "./LineItem";
import { Plus, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceFormProps {
  type: "estimation" | "invoice";
}

export const InvoiceForm = ({ type }: InvoiceFormProps) => {
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [taxRate, setTaxRate] = useState(10);
  const [items, setItems] = useState<LineItemData[]>([
    { id: "1", description: "", quantity: 1, price: 0 },
  ]);

  const addItem = () => {
    const newId = (Math.max(...items.map((i) => parseInt(i.id)), 0) + 1).toString();
    setItems([...items, { id: newId, description: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItemData, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const resetForm = () => {
    setClientName("");
    setClientAddress("");
    setClientEmail("");
    setTaxRate(10);
    setItems([{ id: "1", description: "", quantity: 1, price: 0 }]);
    toast.success("Form reset successfully");
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const validateForm = () => {
    if (!clientName.trim()) {
      toast.error("Please enter client name");
      return false;
    }
    if (!clientEmail.trim()) {
      toast.error("Please enter client email");
      return false;
    }
    if (items.some((item) => !item.description.trim())) {
      toast.error("Please fill in all item descriptions");
      return false;
    }
    return true;
  };

  const generatePDF = () => {
    if (!validateForm()) return;

    const doc = new jsPDF();
    const title = type === "estimation" ? "ESTIMATION" : "INVOICE";

    // Title
    doc.setFontSize(24);
    doc.setTextColor(99, 102, 241); // primary color
    doc.text(title, 20, 20);

    // Client details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Bill To:", 20, 40);
    doc.setFontSize(10);
    doc.text(clientName, 20, 48);
    doc.text(clientAddress, 20, 54);
    doc.text(clientEmail, 20, 60);

    // Date
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 40);

    // Table
    autoTable(doc, {
      startY: 75,
      head: [["Description", "Quantity", "Price", "Subtotal"]],
      body: items.map((item) => [
        item.description,
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${(item.quantity * item.price).toFixed(2)}`,
      ]),
      foot: [
        ["", "", "Subtotal:", `$${subtotal.toFixed(2)}`],
        ["", "", `Tax (${taxRate}%):`, `$${tax.toFixed(2)}`],
        ["", "", "Total:", `$${total.toFixed(2)}`],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [240, 240, 245],
        textColor: 0,
        fontStyle: "bold",
      },
    });

    doc.save(`${type}_${clientName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
    toast.success("PDF generated successfully!");
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-2xl">
          {type === "estimation" ? "Create Estimation" : "Create Invoice"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Client Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              placeholder="John Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="john@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="clientAddress">Client Address</Label>
            <Input
              id="clientAddress"
              placeholder="123 Main St, City, State"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Items</h3>
            <Button onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-muted-foreground pb-2">
              <div className="col-span-12 md:col-span-5">Description</div>
              <div className="col-span-4 md:col-span-2">Quantity</div>
              <div className="col-span-4 md:col-span-2">Price</div>
              <div className="col-span-3 md:col-span-2 text-right">Subtotal</div>
              <div className="col-span-1 md:col-span-1"></div>
            </div>

            {items.map((item) => (
              <LineItem
                key={item.id}
                item={item}
                onChange={updateItem}
                onRemove={removeItem}
                canRemove={items.length > 1}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"></div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm gap-2">
                <Label htmlFor="taxRate" className="text-muted-foreground">
                  Tax Rate (%):
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-20 h-8"
                  />
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-success">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={generatePDF} className="flex-1 gap-2" size="lg">
            <Download className="h-5 w-5" />
            Download PDF
          </Button>
          <Button onClick={resetForm} variant="outline" className="gap-2" size="lg">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
