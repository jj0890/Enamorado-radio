import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

interface GoogleFormResponse {
  timestamp: string;
  name: string;
  alias: string;
  email: string;
  phone?: string;
  location?: string;
  experience?: string;
  genre?: string;
  bio?: string;
  mixUrl?: string;
  availability?: string;
  showConcept?: string;
  equipment?: string;
  additionalInfo?: string;
  [key: string]: string | undefined; // For flexible form fields
}

class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private auth: GoogleAuth;

  constructor() {
    // Create auth instance with service account credentials
    this.auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Extract spreadsheet ID from Google Forms response sheet URL
   */
  private extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL');
    }
    return match[1];
  }

  /**
   * Get the response sheet ID associated with a Google Form
   * Note: You'll need to manually provide this or extract from form settings
   */
  async getFormResponseSheet(formId: string): Promise<string> {
    // For now, we'll use a hardcoded mapping
    // In practice, you'd either:
    // 1. Manually configure the sheet ID for each form
    // 2. Use Google Forms API to get the response sheet
    // 3. Have the user provide the sheet URL/ID
    
    const formToSheetMapping: Record<string, string> = {
      '1FAIpQLSemchUyWBCIvq953jVKTp8kbpOJU1DM9DtMt_Pe-s0F6lKuPw': 'YOUR_SHEET_ID_HERE'
    };

    return formToSheetMapping[formId] || '';
  }

  /**
   * Read all responses from a Google Sheets spreadsheet
   */
  async getFormResponses(spreadsheetId: string, range: string = 'A:Z'): Promise<GoogleFormResponse[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        console.log('No data found in sheet');
        return [];
      }

      // First row contains headers
      const headers = rows[0] as string[];
      const dataRows = rows.slice(1);

      // Map each row to a structured response object
      const responses: GoogleFormResponse[] = dataRows.map((row: string[], index: number) => {
        const response: GoogleFormResponse = {
          timestamp: '',
          name: '',
          alias: '',
          email: '',
        };

        // Map form fields based on common Google Forms column names
        headers.forEach((header, colIndex) => {
          const value = row[colIndex] || '';
          const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Map form fields to our schema
          switch (normalizedHeader) {
            case 'timestamp':
              response.timestamp = value;
              break;
            case 'name':
            case 'fullname':
            case 'yourname':
              response.name = value;
              break;
            case 'alias':
            case 'djname':
            case 'artistname':
            case 'stagename':
              response.alias = value;
              break;
            case 'email':
            case 'emailaddress':
            case 'numberemail':
              response.email = value;
              break;
            case 'phone':
            case 'phonenumber':
            case 'number':
              response.phone = value;
              break;
            case 'location':
            case 'city':
            case 'wherearayou':
            case 'wherearayoubased':
              response.location = value;
              break;
            case 'experience':
            case 'djexperience':
            case 'howlonghaveyoubeendjing':
              response.experience = value;
              break;
            case 'genre':
            case 'musicgenre':
            case 'primarygenre':
            case 'whatgenredoyouplay':
              response.genre = value;
              break;
            case 'bio':
            case 'biography':
            case 'tellaboutyourself':
            case 'aboutyou':
              response.bio = value;
              break;
            case 'mixurl':
            case 'mixtape':
            case 'soundcloud':
            case 'portfolio':
            case 'mixlink':
              response.mixUrl = value;
              break;
            case 'availability':
            case 'whencanyouhost':
            case 'schedule':
              response.availability = value;
              break;
            case 'showConcept':
            case 'showconcept':
            case 'whatshowwouldyoulike':
            case 'showdescription':
              response.showConcept = value;
              break;
            case 'equipment':
            case 'whatequipment':
            case 'gear':
              response.equipment = value;
              break;
            case 'additionalinfo':
            case 'additional':
            case 'anythingelse':
            case 'othernotes':
              response.additionalInfo = value;
              break;
            default:
              // Store unknown fields with original header as key
              response[header] = value;
              break;
          }
        });

        return response;
      });

      console.log(`✅ Retrieved ${responses.length} form responses from Google Sheets`);
      return responses;

    } catch (error) {
      console.error('❌ Error reading Google Sheets:', error);
      throw new Error(`Failed to read form responses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get new responses since a specific timestamp
   */
  async getNewResponses(spreadsheetId: string, sinceTimestamp: Date): Promise<GoogleFormResponse[]> {
    const allResponses = await this.getFormResponses(spreadsheetId);
    
    return allResponses.filter(response => {
      const responseTime = new Date(response.timestamp);
      return responseTime > sinceTimestamp;
    });
  }

  /**
   * Test connection and permissions
   */
  async testConnection(spreadsheetId: string): Promise<boolean> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });
      
      console.log(`✅ Successfully connected to sheet: "${response.data.properties?.title}"`);
      return true;
    } catch (error) {
      console.error('❌ Google Sheets connection test failed:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
export type { GoogleFormResponse };