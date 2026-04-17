// services/locker/vendor-adapter.interface.ts
export type LockerStatus = 'online' | 'offline' | 'maintenance';
export type CompartmentStatus = 'available' | 'occupied' | 'reserved' | 'faulty';

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
  private token: string = '';
  
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
    
    const data = await response.json() as { token: string };
    this.token = data.token;
    return this.token;
  }

  async getLockerStatus(lockerId: string): Promise<LockerStatus> {
    throw new Error('Not implemented');
  }

  async getCompartmentStatus(lockerId: string, compartmentId: string): Promise<CompartmentStatus> {
    throw new Error('Not implemented');
  }

  async reserveCompartment(lockerId: string, compartmentId: string, expiry: Date): Promise<boolean> {
    throw new Error('Not implemented');
  }

  async configureWebhook(url: string, events: string[]): Promise<void> {
    throw new Error('Not implemented');
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
        await this.handlePickup(data as any);
        break;
      case 'locker.offline':
        await this.handleLockerOffline(data as any);
        break;
      case 'compartment.opened':
        await this.handleCompartmentOpened(data as any);
        break;
    }
  }
  
  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.authenticate();
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

  private async handleLockerOffline(data: any) {
    // Handle locker offline
  }

  private async handleCompartmentOpened(data: any) {
    // Handle compartment opened
  }
}

// Stub functions - replace with actual implementations
function emitParcelUpdate(parcelId: string, update: any) {
  // Emit to socket
  console.log('Emitting parcel update:', parcelId, update);
}

class NotificationService {
  static async sendPickupConfirmation(parcelId: string) {
    // Send notification
    console.log('Sending pickup confirmation for:', parcelId);
  }
}






