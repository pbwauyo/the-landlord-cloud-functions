import * as functions from 'firebase-functions'
import {computeDebts, calculateInitialOutstandingBalance, handleDebt, updateLastPayment} from "./util-methods/utils"
import {Rental, Payment} from "./models/models"

export const createDebts = functions.firestore.document("rentals/{rentalId}").onCreate((snapshot, _) => 
    {
        const data = snapshot.data()

        const rentStartDate = String(data?.rentComputationStartDate)
        const splitDate = rentStartDate.split("/")
        const rentStartMonth = splitDate[0]
        const rentStartYear = splitDate[1]

        const rental: Rental = {
            rentalId: data?.id,  
            propertyId: data?.propertyID,
            month: rentStartMonth,
            year: rentStartYear,
            amount: String(data?.monthlyAmount)
        }

        console.log("Created rental: ", rental)

        return computeDebts(rental)
        .then((value) => {

            console.log("RESULT: ", value)
            const amount = Number(rental.amount)

            calculateInitialOutstandingBalance(amount, rental.rentalId)
            .catch((err) => {
                console.error("Err in calc init bal: ", err)
            })
        })
        .catch((err) => {
            console.error("err in creating debts: ", err)
            return Promise.reject(`${err}`)
        })
    }
)

export const updateDebt = functions.firestore.document("payments/{paymentId}").onCreate((snapshot, _) => {
    const data = snapshot.data()

    const rentalId = String(data?.rentalId)
    const amount = Number(data?.amount)
    const dateOfPayment = String(data?.dateOfPayment)
    const month = String(data?.month)
    const year = String(data?.year)

    const payment: Payment = {
        rentalId: rentalId,
        amountPaid: amount,
        dateOfPayment: dateOfPayment,
        month: month,
        year: year
    }

    handleDebt(payment)
    .then((value) => {
        updateLastPayment(rentalId, dateOfPayment)
        .catch((err) => {
            console.log("ERR IN LAST PAYT", err)
        })
    })
    .catch((err) => {
        console.log("ERR IN UPDATE DEBT", err)
    })
})
