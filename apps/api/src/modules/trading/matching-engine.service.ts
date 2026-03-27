import { Injectable, Logger } from '@nestjs/common';

interface OrderBookEntry {
  orderId: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  side: string;
  walletId: string;
  customerId: string;
  timestamp: Date;
}

interface MatchResult {
  makerOrderId: string;
  takerOrderId: string;
  price: number;
  quantity: number;
  quoteAmount: number;
}

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);
  private orderBooks: Map<string, { bids: OrderBookEntry[]; asks: OrderBookEntry[] }> = new Map();

  getOrCreateBook(pairSymbol: string) {
    if (!this.orderBooks.has(pairSymbol)) {
      this.orderBooks.set(pairSymbol, { bids: [], asks: [] });
    }
    return this.orderBooks.get(pairSymbol)!;
  }

  addOrder(pairSymbol: string, entry: OrderBookEntry): MatchResult[] {
    const book = this.getOrCreateBook(pairSymbol);
    const matches: MatchResult[] = [];

    if (entry.side === 'BUY') {
      // Match against asks (lowest first)
      while (entry.remainingQuantity > 0 && book.asks.length > 0) {
        const bestAsk = book.asks[0];
        if (entry.price < bestAsk.price) break; // No match possible

        const fillQty = Math.min(entry.remainingQuantity, bestAsk.remainingQuantity);
        const fillPrice = bestAsk.price; // Maker price
        const quoteAmount = fillQty * fillPrice;

        matches.push({
          makerOrderId: bestAsk.orderId,
          takerOrderId: entry.orderId,
          price: fillPrice,
          quantity: fillQty,
          quoteAmount,
        });

        entry.remainingQuantity -= fillQty;
        bestAsk.remainingQuantity -= fillQty;

        if (bestAsk.remainingQuantity <= 0) {
          book.asks.shift();
        }
      }

      // Add remaining to bids
      if (entry.remainingQuantity > 0) {
        this.insertSorted(book.bids, entry, 'DESC');
      }
    } else {
      // Match against bids (highest first)
      while (entry.remainingQuantity > 0 && book.bids.length > 0) {
        const bestBid = book.bids[0];
        if (entry.price > bestBid.price) break;

        const fillQty = Math.min(entry.remainingQuantity, bestBid.remainingQuantity);
        const fillPrice = bestBid.price;
        const quoteAmount = fillQty * fillPrice;

        matches.push({
          makerOrderId: bestBid.orderId,
          takerOrderId: entry.orderId,
          price: fillPrice,
          quantity: fillQty,
          quoteAmount,
        });

        entry.remainingQuantity -= fillQty;
        bestBid.remainingQuantity -= fillQty;

        if (bestBid.remainingQuantity <= 0) {
          book.bids.shift();
        }
      }

      if (entry.remainingQuantity > 0) {
        this.insertSorted(book.asks, entry, 'ASC');
      }
    }

    return matches;
  }

  removeOrder(pairSymbol: string, orderId: string, side: string): boolean {
    const book = this.getOrCreateBook(pairSymbol);
    const list = side === 'BUY' ? book.bids : book.asks;
    const idx = list.findIndex((o) => o.orderId === orderId);
    if (idx >= 0) {
      list.splice(idx, 1);
      return true;
    }
    return false;
  }

  getOrderBook(pairSymbol: string, depth = 20) {
    const book = this.getOrCreateBook(pairSymbol);
    return {
      bids: book.bids.slice(0, depth).map((o) => ({
        price: o.price,
        quantity: o.remainingQuantity,
      })),
      asks: book.asks.slice(0, depth).map((o) => ({
        price: o.price,
        quantity: o.remainingQuantity,
      })),
      spread: book.asks.length > 0 && book.bids.length > 0
        ? book.asks[0].price - book.bids[0].price
        : null,
    };
  }

  private insertSorted(list: OrderBookEntry[], entry: OrderBookEntry, direction: 'ASC' | 'DESC') {
    let i = 0;
    if (direction === 'DESC') {
      while (i < list.length && list[i].price > entry.price) i++;
      while (i < list.length && list[i].price === entry.price && list[i].timestamp < entry.timestamp) i++;
    } else {
      while (i < list.length && list[i].price < entry.price) i++;
      while (i < list.length && list[i].price === entry.price && list[i].timestamp < entry.timestamp) i++;
    }
    list.splice(i, 0, entry);
  }
}
