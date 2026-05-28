export type ExtractKind = 'stocks' | 'crypto';

export interface ExtractRequest {
  type: 'EXTRACT';
  kind: ExtractKind;
}

export interface Position {
  name: string;
  symbol: string;
  shares: number;
  price: number;
  averageCost: number;
  totalReturn: number;
  equity: number;
}

export interface CryptoPosition {
  name: string;
  symbol: string;
  quantity: number;
  price: number;
  averageCost: number;
  totalReturn: number;
  equity: number;
}

export type ExtractResponse =
  | { ok: true; kind: 'stocks'; rows: Position[] }
  | { ok: true; kind: 'crypto'; rows: CryptoPosition[] }
  | { ok: false; error: string };
