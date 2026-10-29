import { describe, expect, it } from 'vitest';
import { calcRefundAmounts, canRefundAt, REFUND_DEADLINE_HOURS } from '../src/refunds/amounts.js';

const f13 = { id: 'PED-2026-0107-2', price_cents: 3550, fee_cents: 90, commission_cents: 266 };
const vip = { id: 'PED-2026-0107-3', price_cents: 6000, fee_cents: 90, commission_cents: 450 };

describe('calcRefundAmounts', () => {
  it('devuelve cero cuando no hay entradas', () => {
    expect(calcRefundAmounts([])).toEqual({
      amount_cents: 0,
      commission_reversed_cents: 0,
    });
  });

  it('devuelve el precio y revierte la comisión guardada para una entrada', () => {
    expect(calcRefundAmounts([f13])).toEqual({
      amount_cents: 3550,
      commission_reversed_cents: 266,
    });
  });

  it('suma precios y comisiones por entrada sin devolver los gastos de gestión', () => {
    expect(calcRefundAmounts([f13, vip])).toEqual({
      amount_cents: 9550,
      commission_reversed_cents: 716,
    });
  });

  it('suma las comisiones ya redondeadas de cada entrada', () => {
    const tickets = [
      { id: 'ticket-1', price_cents: 1, fee_cents: 90, commission_cents: 1 },
      { id: 'ticket-2', price_cents: 1, fee_cents: 90, commission_cents: 1 },
    ];

    expect(calcRefundAmounts(tickets)).toEqual({
      amount_cents: 2,
      commission_reversed_cents: 2,
    });
  });
});

describe('canRefundAt', () => {
  const event = new Date('2026-11-14T20:00:00Z');
  const deadline = REFUND_DEADLINE_HOURS * 3_600_000;

  it('expone un plazo de devolución de 48 horas', () => {
    expect(REFUND_DEADLINE_HOURS).toBe(48);
  });

  it('permite devolver exactamente en el límite de 48 horas', () => {
    expect(canRefundAt(event, new Date(event.getTime() - deadline))).toBe(true);
  });

  it('permite devolver cuando falta más del plazo', () => {
    expect(canRefundAt(event, new Date(event.getTime() - deadline - 1))).toBe(true);
  });

  it('no permite devolver cuando falta menos de 48 horas', () => {
    expect(canRefundAt(event, new Date(event.getTime() - deadline + 1))).toBe(false);
  });

  it('no permite devolver cuando el evento ya comenzó', () => {
    expect(canRefundAt(event, new Date(event.getTime() + 1))).toBe(false);
  });
});
