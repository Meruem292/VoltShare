
import { RoomInput, CalculatedRoom, BillRecord } from '../types';

export const calculateBill = (
  mainMeterKwh: number,
  ratePerKwh: number,
  rooms: RoomInput[],
  month: string,
  year: number
): BillRecord => {
  const totalSubmeterKwh = rooms.reduce((sum, room) => sum + room.kwh, 0);
  const missingKwh = Math.max(0, mainMeterKwh - totalSubmeterKwh);

  const calculatedRooms: CalculatedRoom[] = rooms.map((room) => {
    // Proportional share based on original consumption
    // Handle division by zero if total submeter is 0
    const share = totalSubmeterKwh > 0 ? room.kwh / totalSubmeterKwh : 0;
    const compensationKwh = share * missingKwh;
    const finalKwh = room.kwh + compensationKwh;
    const billAmount = finalKwh * ratePerKwh;

    return {
      id: room.id,
      name: room.name,
      originalKwh: room.kwh,
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
