import type { CryptoPosition, Position } from './types.js';

const STOCK_COLUMNS = [
  'name',
  'symbol',
  'shares',
  'price',
  'averageCost',
  'totalReturn',
  'equity',
] as const;

const CRYPTO_COLUMNS = [
  'name',
  'symbol',
  'quantity',
  'price',
  'averageCost',
  'totalReturn',
  'equity',
] as const;

export function stocksToCsv(rows: readonly Position[]): string {
  const lines = [STOCK_COLUMNS.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.name),
        csvField(r.symbol),
        formatQuantity(r.shares),
        formatDollar(r.price),
        formatDollar(r.averageCost),
        formatDollar(r.totalReturn),
        formatDollar(r.equity),
      ].join(','),
    );
  }
  return lines.join('\r\n') + '\r\n';
}

export function cryptoToCsv(rows: readonly CryptoPosition[]): string {
  const lines = [CRYPTO_COLUMNS.join(',')];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.name),
        csvField(r.symbol),
        formatQuantity(r.quantity),
        formatDollar(r.price),
        formatDollar(r.averageCost),
        formatDollar(r.totalReturn),
        formatDollar(r.equity),
      ].join(','),
    );
  }
  return lines.join('\r\n') + '\r\n';
}

function csvField(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function formatQuantity(n: number): string {
  return n.toFixed(3);
}

function formatDollar(n: number): string {
  return n.toFixed(2);
}
