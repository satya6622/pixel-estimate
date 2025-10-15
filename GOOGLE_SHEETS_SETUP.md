# Google Apps Script Integration Setup

This guide will help you set up Google Apps Script integration to automatically save invoice and estimate data.

## Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "Invoice Data" (or any name you prefer)
4. Add headers in row 1:
   - A1: S.No
   - B1: ID
   - C1: Email
   - D1: Address
   - E1: Phone
   - F1: Pincode
   - G1: Description & Features
   - H1: Quantity
   - I1: Rate
   - J1: Amount
   - K1: Total Amount
   - L1: Advance
   - M1: Type
   - N1: Delivery Fee
   - O1: Mode of Payment

## Step 2: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Replace the default code with this script:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    const rows = data.data;
    
    // Add data to the sheet
    if (rows && rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("Google Apps Script is running!")
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. Save the project (Ctrl+S)
5. Give it a name like "Invoice Data Handler"

## Step 3: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Choose "Web app" as the type
3. Set the following:
   - Description: "Invoice Data Handler"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. Copy the web app URL (it will look like: `https://script.google.com/macros/s/...`)

## Step 4: Configure Environment Variables (Optional)

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your script URL:
   ```env
   VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_URL_HERE/exec
   ```

**Note**: The script URL is already hardcoded in the code, so this step is optional.

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create an invoice or estimate
3. Click "Save to Sheets" button
4. Check your Google Spreadsheet for the data

## Data Structure

The spreadsheet will have these columns:
- S.No
- ID (format: clientname_timestamp)
- Email
- Address
- Phone
- Pincode
- Description & Features
- Quantity
- Rate
- Amount
- Total Amount
- Advance
- Type (estimate/invoice)
- Delivery Fee
- Mode of Payment

Each item from an invoice/estimate will be saved as a separate row with the same ID.

## Troubleshooting

- **"Data sent to Google Apps Script" but no data appears**: Check your Apps Script logs in the Google Apps Script editor
- **CORS errors**: Make sure your Apps Script is deployed as a web app with "Anyone" access
- **Script not found**: Verify the script URL is correct and the script is deployed

## Security Notes

- The script runs with your Google account permissions
- Anyone with the URL can send data to your spreadsheet
- Consider adding authentication if you need more security
