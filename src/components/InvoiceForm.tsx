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
  const [clientPhone, setClientPhone] = useState("");
  const [clientPincode, setClientPincode] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [advancePaid, setAdvancePaid] = useState(0);
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [items, setItems] = useState<LineItemData[]>([
    { id: "1", description: "", features: "", quantity: 1, price: 0 },
  ]);

  // Static company details (TO address)
  const companyName = "Blessing designers";
  const companyAddress = "Shop no 5&6 city market guntur";
  const companyCity = "Guntur";
  const companyPincode = "522001";
  const companyPhone = "9381451901";
  const companyEmail = "satyateja@gmail.com";

  const addItem = () => {
    const newId = (Math.max(...items.map((i) => parseInt(i.id)), 0) + 1).toString();
    setItems([...items, { id: newId, description: "", features: "", quantity: 1, price: 0 }]);
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
    setClientPhone("");
    setClientPincode("");
    setDate(new Date().toISOString().split('T')[0]);
    setAdvancePaid(0);
    setModeOfPayment("");
    setItems([{ id: "1", description: "", features: "", quantity: 1, price: 0 }]);
    toast.success("Form reset successfully");
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const total = subtotal;
  const balanceDue = type === "invoice" ? total - advancePaid : total;

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
    const docNumber = type === "estimation" ? "EST0001" : "INV0001";
    const title = type === "estimation" ? "ESTIMATE" : "INVOICE";
    
    // Header - Date and Title
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${new Date(date).toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour12: false })}`, 14, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${companyName} - ${title} ${docNumber}`, 105, 15, { align: 'center' });
    
    // Line under header
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.line(14, 18, 196, 18);
    
    // Company Details (Left side)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 14, 28);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(companyAddress, 14, 35);
    doc.text(companyCity, 14, 41);
    doc.text(companyPincode, 14, 47);
    doc.text(companyPhone, 14, 53);
    doc.text(companyEmail, 14, 59);
    
    // Document info (Right side)
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(title, 196, 28, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(docNumber, 196, 34, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.text('DATE', 196, 42, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 196, 48, { align: 'right' });
    
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL', 196, 56, { align: 'right' });
    doc.setFont(undefined, 'normal');
    doc.text(`INR ₹${total.toFixed(2)}`, 196, 62, { align: 'right' });
    
    // TO Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('TO', 14, 72);
    
    doc.setFontSize(12);
    doc.text(clientName, 14, 80);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(clientAddress, 14, 87);
    if (clientPincode) doc.text(clientPincode, 14, 93);
    if (clientPhone) doc.text(clientPhone, 14, 99);
    doc.text(clientEmail, 14, 105);
    
    // Table with items
    const tableBody = items.map((item) => {
      const descriptionLines = [item.description];
      if (item.features) {
        const featuresList = item.features.split('\n').filter(f => f.trim());
        descriptionLines.push(...featuresList);
      }
      
      return [
        descriptionLines.join('\n'),
        `₹${item.price.toFixed(2)}`,
        item.quantity.toString(),
        `₹${(item.quantity * item.price).toFixed(2)}`,
      ];
    });
    
    autoTable(doc, {
      startY: 115,
      head: [["DESCRIPTION", "RATE", "QTY", "AMOUNT"]],
      body: tableBody,
      theme: "plain",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: 0,
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 36 },
      },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Total section
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL', 160, finalY, { align: 'right' });
    doc.text(`INR ₹${total.toFixed(2)}`, 196, finalY, { align: 'right' });
    
    // Invoice specific fields
    if (type === "invoice" && advancePaid > 0) {
      doc.setFont(undefined, 'normal');
      doc.text('Advance Paid:', 160, finalY + 7, { align: 'right' });
      doc.text(`INR ₹${advancePaid.toFixed(2)}`, 196, finalY + 7, { align: 'right' });
      
      doc.setFont(undefined, 'bold');
      doc.text('Balance Due:', 160, finalY + 14, { align: 'right' });
      doc.text(`INR ₹${balanceDue.toFixed(2)}`, 196, finalY + 14, { align: 'right' });
    }
    
    if (type === "invoice" && modeOfPayment) {
      doc.setFont(undefined, 'normal');
      doc.text(`Mode of Payment: ${modeOfPayment}`, 14, finalY + 7);
    }

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
        {/* Date and Document Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {type === "invoice" && (
            <div className="space-y-2">
              <Label htmlFor="modeOfPayment">Mode of Payment</Label>
              <Input
                id="modeOfPayment"
                placeholder="e.g., Cash, UPI, Bank Transfer"
                value={modeOfPayment}
                onChange={(e) => setModeOfPayment(e.target.value)}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Client Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Client Details (TO)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="Ambika Textiles"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email *</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="ambika@gmail.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Input
                id="clientAddress"
                placeholder="Sai Ganesh Apartments Paramaikunta 1st Lane"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                placeholder="9876543210"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPincode">Pincode</Label>
              <Input
                id="clientPincode"
                placeholder="522001"
                value={clientPincode}
                onChange={(e) => setClientPincode(e.target.value)}
              />
            </div>
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
              <div className="col-span-12 md:col-span-5">Description & Features</div>
              <div className="col-span-4 md:col-span-2">Quantity</div>
              <div className="col-span-4 md:col-span-2">Rate</div>
              <div className="col-span-3 md:col-span-2 text-right">Amount</div>
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
              <div className="flex justify-between text-lg font-bold text-success">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              
              {type === "invoice" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm gap-2">
                      <Label htmlFor="advancePaid" className="text-muted-foreground">
                        Advance Paid:
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">₹</span>
                        <Input
                          id="advancePaid"
                          type="number"
                          min="0"
                          step="0.01"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                          className="w-32 h-8"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Balance Due:</span>
                      <span>₹{balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
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
