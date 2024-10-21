export enum OrderType {
    // Market Order - order will be filled at the best available price
    'FOK' = 'FOK', // Fill or Kill - order must be filled immediately and entirely or it will be cancelled
    // Limit Order - order will be filled at the specified price or better
    'GTC' = 'GTC', // Good Till Cancelled - order will be active until it is filled or cancelled
    'GTD' = 'GTD', // Good Till Date - order will be active until it is filled, cancelled, or until the specified date
}

export enum OrderSide {
    'Bid' = 'Bid',
    'Ask' = 'Ask',
}

export enum OrderStatus {
    Pending = 'pending',
    Matching = 'matching',
    Filled = 'filled',
    Completed = 'completed',
    Cancelled = 'cancelled',
}
