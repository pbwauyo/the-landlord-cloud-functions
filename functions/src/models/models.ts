export interface Debt{
    month: string
    year: string
    amount: string
    rentalId: string
    propertyId: string
}

export interface Rental{
    rentalId: string
    propertyId: string
    month: string
    year: string
    amount: string
}