
export interface RoomInput {
  id: string;
  name: string;
  kwh: number;
}

export interface RentalRoomTemplate {
  id: string;
  name: string;
}

export interface RentalProperty {
  id: string;
  name: string;
  rooms: RentalRoomTemplate[];
  userId: string;
  createdAt: number;
}

export interface CalculatedRoom {
  id: string;
  name: string;
  originalKwh: number;
  share: number;
  compensationKwh: number;
  finalKwh: number;
  billAmount: number;
}

export interface BillRecord {
  id: string;
  month: string;
  year: number;
  ratePerKwh: number;
  mainMeterKwh: number;
  totalSubmeterKwh: number;
  missingKwh: number;
  rooms: CalculatedRoom[];
  createdAt: number;
  propertyId?: string;
  propertyName?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type AppView = 'landing' | 'signin' | 'signup' | 'dashboard' | 'calculator' | 'history' | 'rentals';
