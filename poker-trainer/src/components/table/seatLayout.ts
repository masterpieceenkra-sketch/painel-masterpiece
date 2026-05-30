import type { Position } from "@/domain/cards";

/**
 * 6-max seat order. Matches MatrixSelector.tsx convention.
 * Clockwise from UTG → HJ → CO → BTN → SB → BB.
 */
export const SEAT_ORDER_6MAX: Position[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];

/**
 * Angles (degrees) used to place each seat around the oval, measured in the
 * standard SVG/CSS convention where +y points down.
 *
 * BB sits at the top of the table (270° → sin = -1 → y = cy - ry).
 * Seats proceed clockwise from BB: BB → UTG (upper-left) → HJ (lower-left) →
 * CO (bottom-right area) → BTN (upper-right) → SB (between BTN and BB).
 */
const SEAT_ANGLE_DEG: Record<Position, number> = {
  BB: 270,
  UTG: 210,
  HJ: 150,
  CO: 90,
  BTN: 30,
  SB: 330,
  // Positions outside 6-max are not laid out on this table but typed for completeness.
  UTG1: 210,
  MP: 180,
  LJ: 200,
};

// Ellipse parameters (in % units relative to a 100×100 container).
export const TABLE_RX = 42;
export const TABLE_RY = 32;
export const TABLE_CX = 50;
export const TABLE_CY = 50;

export type SeatCoord = { x: number; y: number };

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Returns the (x, y) percentage coordinates for a seat at the given index of
 * SEAT_ORDER_6MAX. Coordinates are relative to the table container box.
 */
export function seatPosition(idx: number): SeatCoord {
  const len = SEAT_ORDER_6MAX.length;
  const i = ((idx % len) + len) % len;
  return seatPositionFor(SEAT_ORDER_6MAX[i]);
}

/**
 * Same as seatPosition but addressed by Position name. Falls back to BB
 * coordinates for positions not present in the 6-max ring.
 */
export function seatPositionFor(position: Position): SeatCoord {
  const angle = SEAT_ANGLE_DEG[position] ?? SEAT_ANGLE_DEG.BB;
  const rad = toRad(angle);
  return {
    x: TABLE_CX + TABLE_RX * Math.cos(rad),
    y: TABLE_CY + TABLE_RY * Math.sin(rad),
  };
}

/**
 * Dealer button sits just inside the rail near the BTN seat (slightly inside
 * the ellipse).
 */
export function dealerButtonPosition(): SeatCoord {
  const rad = toRad(SEAT_ANGLE_DEG.BTN);
  const innerRx = TABLE_RX - 10;
  const innerRy = TABLE_RY - 8;
  return {
    x: TABLE_CX + innerRx * Math.cos(rad),
    y: TABLE_CY + innerRy * Math.sin(rad),
  };
}
