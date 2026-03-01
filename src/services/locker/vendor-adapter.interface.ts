// services/locker/vendor-adapter.interface.ts
export interface LockerVendorAdapter {
  // Authentication
  authenticate(): Promise<string>;
  
  // Locker Management
  getLockerStatus(lockerId: string): Promise<LockerStatus>;
  getCompartmentStatus(lockerId: string, compartmentId: string): Promise<CompartmentStatus>;
  
  // Operations
  openCompartment(lockerId: string, compartmentId: string, code?: string): Promise<boolean>;
  reserveCompartment(lockerId: string, compartmentId: string, expiry: Date): Promise<boolean>;
  
  // Webhook Configuration
  configureWebhook(url: string, events: string[]): Promise<void>;
  
  // Events
  handleWebhook(payload: any): Promise<void>;
}

// services/locker/vendor-adapters/zhilai.adapter.ts
export class ZhilaiLockerAdapter implements LockerVendorAdapter {
  private apiKey: string;
  private baseUrl: string;
  private token: string;
  
  constructor(config: { apiKey: string; baseUrl: string }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }
  
  async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey })
    });
    
    const data = await response.json();
    this.token = data.token;
    return this.token;
  }
  
  async openCompartment(lockerId: string, compartmentId: string, code?: string): Promise<boolean> {
    await this.ensureAuthenticated();
    
    const response = await fetch(`${this.baseUrl}/lockers/${lockerId}/compartments/${compartmentId}/open`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, timestamp: Date.now() })
    });
    
    return response.ok;
  }
  
  async handleWebhook(payload: any): Promise<void> {
    const { event, data } = payload;
    
    switch(event) {
      case 'parcel.picked_up':
        await this.handlePickup(data);
        break;
      case 'locker.offline':
        await this.handleLockerOffline(data);
        break;
      case 'compartment.opened':
        await this.handleCompartmentOpened(data);
        break;
    }
  }
  
  private async handlePickup(data: any) {
    // Update your database
    const { parcelId, timestamp } = data;
    
    // Emit socket event to merchant
    emitParcelUpdate(parcelId, {
      status: 'picked_up',
      timestamp
    });
    
    // Send notification
    await NotificationService.sendPickupConfirmation(parcelId);
  }
}






