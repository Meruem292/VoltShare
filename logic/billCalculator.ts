
import { RoomInput, CalculatedRoom, BillRecord } from '../types';

export const calculateBill = (
  mainMeterKwhInput: string | number,
  ratePerKwhInput: string | number,
  rooms: RoomInput[],
  month: string,
  year: number
): BillRecord => {
  const mainMeterKwh = Number(mainMeterKwhInput) || 0;
  const ratePerKwh = Number(ratePerKwhInput) || 0;
  
  const totalSubmeterKwh = rooms.reduce((sum, room) => sum + (Number(room.kwh) || 0), 0);
  const missingKwh = Math.max(0, mainMeterKwh - totalSubmeterKwh);

  const calculatedRooms: CalculatedRoom[] = rooms.map((room) => {
    const originalKwh = Number(room.kwh) || 0;
    // Proportional share based on original consumption
    const share = totalSubmeterKwh > 0 ? originalKwh / totalSubmeterKwh : 0;
    const compensationKwh = share * missingKwh;
    const finalKwh = originalKwh + compensationKwh;
    const billAmount = finalKwh * ratePerKwh;

    return {
      id: room.id,
      name: room.name,
      originalKwh: originalKwh,
      share: share,
      compensationKwh: compensationKwh,
      finalKwh: finalKwh,
      billAmount: billAmount,
    };
  });

  return {
    id: crypto.randomUUID(),
    month,
    year,
    ratePerKwh,
    mainMeterKwh,
    totalSubmeterKwh,
    missingKwh,
    rooms: calculatedRooms,
    createdAt: Date.now(),
  };
};
