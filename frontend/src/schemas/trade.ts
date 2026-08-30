import { z } from 'zod';

export const tradeFormSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, 'Symbol is required')
    .max(12, 'Symbol is too long'),
  side: z.enum(['BUY', 'SELL'], {
    message: 'Side must be BUY or SELL',
  }),
  status: z.enum(['ACTIVE', 'CANCELLED'], {
    message: 'Status must be ACTIVE or CANCELLED',
  }),
  quantity: z.coerce.number({ message: 'Quantity is required' }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
  price: z.coerce.number({ message: 'Price is required' }).min(0.01, 'Price must be greater than 0'),
  trader: z
    .string()
    .trim()
    .min(1, 'Trader is required'),
  book: z
    .string()
    .trim()
    .min(1, 'Book is required'),
  counterparty: z
    .string()
    .trim()
    .min(1, 'Counterparty is required'),
  tradeDate: z
    .string()
    .trim()
    .min(1, 'Trade date is required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Trade date is invalid',
    }),
});

export type TradeFormValues = z.infer<typeof tradeFormSchema>;

export const tradeFormDefaults: TradeFormValues = {
  symbol: '',
  side: 'BUY',
  status: 'ACTIVE',
  quantity: 100,
  price: 0,
  trader: '',
  book: 'EQ-NA',
  counterparty: '',
  tradeDate: new Date().toISOString(),
};
