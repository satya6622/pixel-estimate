// Google Apps Script web app URL
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyQwsV0i5ERTCRpgMDFoQD5WavIf_ETZ7iCUk7k9koZxtL0D0v-JTQUVv0KIGwqmY2mUA/exec'

export interface InvoiceData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
  clientPincode: string;
  items: Array<{
    description: string;
    features: string;
    quantity: number;
    price: number;
    amount: number;
    deliveryFee: number;
  }>;
  totalAmount: number;
  advancePaid: number;
  type: 'estimate' | 'invoice';
  modeOfPayment: string;
}

// Generate unique ID: name_timestamp
const generateId = (clientName: string): string => {
  const timestamp = Date.now();
  const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${cleanName}_${timestamp}`;
};

// Format data for Google Sheets
const formatDataForSheets = (data: InvoiceData) => {
  const rows: any[][] = [];
  const baseId = generateId(data.clientName);
  
  data.items.forEach((item, index) => {
    const row = [
      index + 1, // S.No
      baseId, // ID (same for all items from same invoice)
      data.clientEmail,
      data.clientAddress,
      data.clientPhone,
      data.clientPincode,
      `${item.description}${item.features ? ` - ${item.features}` : ''}`, // Description & Features combined
      item.quantity,
      item.price,
      item.amount,
      data.totalAmount, // Total amount (same for all items)
      data.advancePaid,
      data.type,
      item.deliveryFee,
      data.modeOfPayment,
    ];
    rows.push(row);
  });
  
  return rows;
};

// Save data to Google Sheets via Apps Script
export const saveToGoogleSheets = async (data: InvoiceData): Promise<boolean> => {
  try {
    // Format data for the script
    const rows = formatDataForSheets(data);

    // Send data to Google Apps Script
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for cross-origin requests to Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: rows,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log('Data sent to Google Apps Script');
    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
};
