// models/StaffAgent.ts
export interface IStaffAgent extends Document {
  name: string;
  phone: string;
  locationId: mongoose.Types.ObjectId;
  shift: {
    start: string;
    end: string;
    timezone: string;
  };
  keys: {
    assignedCompartments: string[];
    keyRing: string[];
    lastAudit: Date;
  };
  status: 'on_duty' | 'off_duty' | 'break';
  createdAt: Date;
  updatedAt: Date;
}