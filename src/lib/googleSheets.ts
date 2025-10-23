// Google Apps Script web app URL
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyQwsV0i5ERTCRpgMDFoQD5WavIf_ETZ7iCUk7k9koZxtL0D0v-JTQUVv0KIGwqmY2mUA/exec'
const SCRIPT_URL_MASTER = import.meta.env.VITE_GOOGLE_SCRIPT_URL_MASTER || 'https://script.google.com/macros/s/AKfycbwpF-WH1C_vNc72j8ZYzc0M7qaXtsQ2sg_pw3cDrWw4gwwPivXD_QIjSfII644m3vbLbw/exec'

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
  date: string;
}

// Generate unique ID: name_timestamp
const generateId = (clientName: string): string => {
  // Use Indian timezone for consistent timestamps
  const now = new Date();
  const indianTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const timestamp = indianTime.getTime();
  const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `${cleanName}_${timestamp}`;
};

// Format data for Google Sheets
const formatDataForSheets = (data: InvoiceData) => {
  const rows: any[][] = [];
  const summaryRow: any[][] = [];
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

  summaryRow.push([
    baseId, // ID (same for all items from same invoice)
    data.clientName,
    data.clientEmail,
    data.clientAddress,
    data.clientPhone,
    data.clientPincode,
    data.totalAmount,
    data.advancePaid,
    data.type,
    data.modeOfPayment,
    data.date,
    data.items.length,
    data.items.reduce((sum, item) => sum + item.quantity, 0),
    data.items.reduce((sum, item) => sum + item.amount, 0),
    data.items.reduce((sum, item) => sum + item.deliveryFee, 0),
  ]);

  return [rows, summaryRow];
};



// Save data to Google Sheets via Apps Script
export const saveToGoogleSheets = async (data: InvoiceData): Promise<boolean> => {
  try {
    // Format data for the script
    const [formattedRows, summaryRows] = formatDataForSheets(data);

    // console.log("Formatted Rows:", JSON.stringify(formattedRows[0]));
    // console.log("Formatted Rows:", JSON.stringify(summaryRows[0]));

    // const reponseZTest = await fetch(SCRIPT_URL, {
    //   method: 'POST',
    //   mode: 'no-cors', // Required for cross-origin requests to Google Apps Script
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({   
    //     data: formattedRows, 
    //     timestamp: new Date().toISOString(),
    //   }),
    // });
    // console.log("Response Z Test:", reponseZTest);

    // Send data to Google Apps Script
    const [response1, response2] = await Promise.all(
        [
            fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Required for cross-origin requests to Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: formattedRows, 
                timestamp: new Date().toISOString(),
            }),
        }),
        fetch(SCRIPT_URL_MASTER, {
            method: 'POST',
            mode: 'no-cors', // Required for cross-origin requests to Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: summaryRows, 
                timestamp: new Date().toISOString(),
            }),
        })
    ]);

    // console.log(response1);

    console.log('Data sent to Google Apps Script');
    console.log("Response Submitted");
    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
};

