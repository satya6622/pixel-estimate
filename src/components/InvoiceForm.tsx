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
import { saveToGoogleSheets, InvoiceData } from "@/lib/googleSheets";

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
  // Keep as string so the input can be blank
  const [advancePaid, setAdvancePaid] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [discount, setDiscount] = useState("");
  const [items, setItems] = useState<LineItemData[]>([
    { id: "1", description: "", features: "", quantity: 1, price: 0, deliveryFee: 0, cornerCutting: 0 },
  ]);

  // Static company details (TO address)
  const companyName = "Blessing Connect Studio";
  const companyAddress = "Andhra pradesh, Guntur";
  // const companyCity = "Guntur";
  const companyPincode = "522001";
  const companyPhone = "9381451900";
  const companyEmail = "blessingconnectstudio@gmail.com";

  const addItem = () => {
    const newId = (Math.max(...items.map((i) => parseInt(i.id)), 0) + 1).toString();
    setItems([...items, { id: newId, description: "", features: "", quantity: 1, price: 0, deliveryFee: 0, cornerCutting: 0 }]);
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
    setAdvancePaid("");
    setModeOfPayment("");
    setDiscount("");
    setItems([{ id: "1", description: "", features: "", quantity: 1, price: 0, deliveryFee: 0, cornerCutting: 0 }]);
    toast.success("Form reset successfully");
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const deliveryFees = items.reduce((sum, item) => sum + item.deliveryFee, 0);
  const totalCornerCutting = items.reduce((sum, item) => sum + item.cornerCutting, 0);
  const numericDiscount = parseFloat(discount) || 0;
  const totalBeforeRoundOff = subtotal + deliveryFees + totalCornerCutting - numericDiscount;
  // Round up to nearest whole number (no paise)
  const roundedTotal = Math.ceil(totalBeforeRoundOff);
  const roundOff = roundedTotal - totalBeforeRoundOff;
  const total = roundedTotal; // Final total without decimals
  const numericAdvancePaid = parseFloat(advancePaid) || 0;
  const balanceDue = type === "invoice" ? total - numericAdvancePaid : total;

  // Consistent INR formatting like the provided sample
  // Format to ASCII-only text for jsPDF built-in fonts (avoid ₹ and NBSP)
  const formatINRNumber = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace(/[\u00A0\u202F]/g, " ");
  const formatINRWithCode = (value: number) => `INR ${formatINRNumber(value)}`;
  const formatINRNumberNoDecimals = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/[\u00A0\u202F]/g, " ");
  const formatINRWithCodeNoDecimals = (value: number) => `INR ${formatINRNumberNoDecimals(value)}`;

  // Prepare data for Google Sheets
  const prepareDataForSheets = (): InvoiceData => {
    return {
      clientName,
      clientEmail,
      clientAddress,
      clientPhone,
      clientPincode,
      items: items.map(item => ({
        description: item.description,
        features: item.features,
        quantity: item.quantity,
        price: item.price,
        amount: item.quantity * item.price,
        deliveryFee: item.deliveryFee,
        cornerCutting: item.cornerCutting,
      })),
      totalAmount: total,
      advancePaid: numericAdvancePaid,
      type: type === "estimation" ? "estimate" : "invoice",
      modeOfPayment,
      date,
      cornerCutting: totalCornerCutting,
      discount: numericDiscount,
      roundOff: roundOff,
    };
  };

  // Save to Google Sheets
  const saveToSheets = async () => {
    try {
      const data = prepareDataForSheets();
      const success = await saveToGoogleSheets(data);
      
      if (success) {
        toast.success("Data saved to Google Sheets successfully!");
      } else {
        toast.error("Failed to save data to Google Sheets");
      }
    } catch (error) {
      console.error('Error saving to sheets:', error);
      toast.error("Error saving to Google Sheets");
    }
  };

  const validateForm = () => {
    if (!clientName.trim()) {
      toast.error("Please enter client name");
      return false;
    }
    // if (!clientEmail.trim()) {
    //   toast.error("Please enter client email");
    //   return false;
    // }
    if (items.some((item) => !item.description.trim())) {
      toast.error("Please fill in all item descriptions");
      return false;
    }
    return true;
  };

  const generatePDF = async () => {
    if (!validateForm()) return;

    const doc = new jsPDF();
    // Explicitly set a standard font to avoid glyph spacing issues
    doc.setFont("helvetica", "normal");

    // Theme palette (subtle orange)
    const accent = { r: 245, g: 158, b: 11 }; // soft orange for header rule
    const accentLight = { r: 255, g: 250, b: 240 }; // very light orange for zebra rows
    const gray = { r: 107, g: 114, b: 128 }; // gray-500 for secondary text
    const border = { r: 226, g: 232, b: 240 }; // light border
    const headLight = { r: 255, g: 245, b: 235 }; // light orange for table head
    // const docNumber = type === "estimation" ? "EST0001" : "INV0001";
    const title = type === "estimation" ? "ESTIMATE" : "INVOICE";
    
    // Header - Date and Title
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${new Date(date).toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour12: false })}`, 14, 15);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${companyName} - ${title}`, 105, 15, { align: 'center' });
    
    // Colored header line
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(1);
    doc.line(14, 18, 196, 18);
    
    // Company Details (Left side)
    doc.setFontSize(16);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(companyName, 14, 28);
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');
    doc.setTextColor(gray.r, gray.g, gray.b);
    doc.text(companyAddress, 14, 35);
    // doc.text(companyCity, 14, 41);
    doc.text(companyPincode, 14, 41);
    doc.text(companyPhone, 14, 47);
    doc.text(companyEmail, 14, 53);
    
    // Document info (Right side)
    doc.setFontSize(10);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 196, 28, { align: 'right' });
    doc.setFont("helvetica", 'normal');
    doc.setTextColor(0, 0, 0);
    // doc.text(docNumber, 196, 34, { align: 'right' });
    
    doc.setFont("helvetica", 'bold');
    doc.text('DATE', 196, 42, { align: 'right' });
    doc.setFont("helvetica", 'normal');
    doc.text(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 196, 48, { align: 'right' });
    
    doc.setFont("helvetica", 'bold');
    doc.text('TOTAL', 196, 56, { align: 'right' });
    doc.setFont("helvetica", 'normal');
    doc.text(`${formatINRWithCodeNoDecimals(total)}`, 196, 62, { align: 'right' });
    
    // TO Section
    doc.setFontSize(10);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TO', 14, 72);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(clientName, 14, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');
    doc.setTextColor(gray.r, gray.g, gray.b);
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
        `${formatINRNumber(item.price)}`,
        item.quantity.toString(),
        `${formatINRNumber(item.quantity * item.price)}`,
      ];
    });
    
    autoTable(doc, {
      startY: 115,
      head: [["DESCRIPTION", "RATE", "QTY", "AMOUNT"]],
      body: tableBody,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontStyle: "normal",
        fontSize: 10,
        textColor: 0,
        cellPadding: 4,
        lineColor: [border.r, border.g, border.b],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [headLight.r, headLight.g, headLight.b],
        textColor: 0,
        fontStyle: "bold",
        lineWidth: 0.2,
        lineColor: [border.r, border.g, border.b],
      },
      bodyStyles: {
        lineWidth: 0.2,
        lineColor: [border.r, border.g, border.b],
      },
      alternateRowStyles: {
        fillColor: [accentLight.r, accentLight.g, accentLight.b],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'center', cellWidth: 36 },
      },
    });
    
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Delivery Fee section
    const itemsWithDeliveryFee = items.filter(item => item.deliveryFee > 0);
    if (itemsWithDeliveryFee.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", 'bold');
      doc.setTextColor(0, 0, 0);
      // doc.text('Delivery Fee Items:', 14, finalY);
      
      let deliveryY = finalY + 7;
      // itemsWithDeliveryFee.forEach((item, index) => {
      //   doc.setFont("helvetica", 'normal');
      //   doc.text(`${item.description}: ${formatINRWithCode(item.deliveryFee)}`, 20, deliveryY);
      //   deliveryY += 5;
      // });
      
      finalY = deliveryY + 5;
    }
    
    // Total section (simple, no color)
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');
    doc.text('Subtotal:', 160, finalY, { align: 'right' });
    doc.text(`${formatINRWithCode(subtotal)}`, 196, finalY, { align: 'right' });
    
    if (deliveryFees > 0) {
      doc.setFont("helvetica", 'normal');
      doc.text('Delivery Fee:', 160, finalY + 7, { align: 'right' });
      doc.text(`${formatINRWithCode(deliveryFees)}`, 196, finalY + 7, { align: 'right' });
      finalY += 7;
    }
    
    if (totalCornerCutting > 0) {
      doc.setFont("helvetica", 'normal');
      doc.text('Total Corner Cutting:', 160, finalY + 7, { align: 'right' });
      doc.text(`${formatINRWithCode(totalCornerCutting)}`, 196, finalY + 7, { align: 'right' });
      finalY += 7;
    }
    
    if (numericDiscount > 0) {
      doc.setFont("helvetica", 'normal');
      doc.text('Discount:', 160, finalY + 7, { align: 'right' });
      doc.text(`-${formatINRWithCode(numericDiscount)}`, 196, finalY + 7, { align: 'right' });
      finalY += 7;
    }
    
    if (roundOff > 0) {
      doc.setFont("helvetica", 'normal');
      doc.text('Round Off:', 160, finalY + 7, { align: 'right' });
      doc.text(`${formatINRWithCode(roundOff)}`, 196, finalY + 7, { align: 'right' });
      finalY += 7;
    }
    
    doc.setFont("helvetica", 'bold');
    doc.text('TOTAL', 160, finalY + 7, { align: 'right' });
    doc.setFont("helvetica", 'normal');
    doc.text(`${formatINRWithCodeNoDecimals(total)}`, 196, finalY + 7, { align: 'right' });
    finalY += 7;
    
    // Invoice specific fields
    if (type === "invoice" && numericAdvancePaid > 0) {
      doc.setFont("helvetica", 'normal');
      doc.text('Advance Paid:', 160, finalY + 7, { align: 'right' });
      doc.text(`${formatINRWithCode(numericAdvancePaid)}`, 196, finalY + 7, { align: 'right' });
      
      doc.setFont("helvetica", 'bold');
      doc.text('Balance Due:', 160, finalY + 14, { align: 'right' });
      doc.setFont("helvetica", 'normal');
      doc.text(`${formatINRWithCodeNoDecimals(balanceDue)}`, 196, finalY + 14, { align: 'right' });
    }

    // Footer
    doc.setDrawColor(border.r, border.g, border.b);
    doc.setLineWidth(0.2);
    doc.line(14, 282, 196, 282);
    doc.setTextColor(gray.r, gray.g, gray.b);
    doc.setFontSize(9);
    doc.text('Thank you for your business!', 14, 286,);
    
    if (type === "invoice" && modeOfPayment) {
      doc.setFont(undefined, 'normal');
      doc.text(`Mode of Payment: ${modeOfPayment}`, 14, finalY + 7);
    }

    doc.save(`${type}_${clientName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
    
    // Save to Google Sheets
    await saveToSheets();
    
    toast.success("PDF generated and data saved successfully!");
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
          <h3 className="text-lg font-semibold">Client Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                // placeholder="Ambika Textiles"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                // placeholder="blessingdesigners01@gmail.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Input
                id="clientAddress"
                // placeholder="Sai Ganesh Apartments Paramaikunta 1st Lane"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                // placeholder="9876543210"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPincode">Pincode</Label>
              <Input
                id="clientPincode"
                // placeholder="522001"
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

        {/* Discount */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">₹</span>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"></div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {deliveryFees > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery Fee:</span>
                  <span>₹{deliveryFees.toFixed(2)}</span>
                </div>
              )}
              {totalCornerCutting > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Total Corner Cutting:</span>
                  <span>₹{totalCornerCutting.toFixed(2)}</span>
                </div>
              )}
              {numericDiscount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Discount:</span>
                  <span className="text-red-600">-₹{numericDiscount.toFixed(2)}</span>
                </div>
              )}
              {roundOff > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Round Off:</span>
                  <span>₹{roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-success">
                <span>Total:</span>
                <span>₹{total.toFixed(0)}</span>
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
                          // min="0"
                          step="1"
                          value={advancePaid}
                          onChange={(e) => setAdvancePaid(e.target.value)}
                          className="w-32 h-8"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Balance Due:</span>
                      <span>₹{balanceDue.toFixed(0)}</span>
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
            Download PDF & Save
          </Button>
          <Button onClick={saveToSheets} variant="outline" className="gap-2" size="lg">
            <Download className="h-4 w-4" />
            Save to Sheets
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
