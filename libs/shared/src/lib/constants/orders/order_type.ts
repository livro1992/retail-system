export enum OrderType {
    receipt = 'receipt',
    transfer = 'transfer', // Ammissibile a prezzo zero
    instantCash = 'instant_cash',
    pickup = 'pickup', // ritiro differito in magazzino
    delivery = 'delivery' // acquisto online e spedizione
}