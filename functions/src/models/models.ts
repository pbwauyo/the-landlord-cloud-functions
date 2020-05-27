export interface Debt{
    debtId: string
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

export interface Payment{
    month: string
    year: string
    dateOfPayment: string
    rentalId: string
    amountPaid: number
}