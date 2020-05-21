import * as functions from 'firebase-functions'
import {computeDebts, calculateInitialOutstandingBalance} from "./util-methods/utils"
import {Rental} from "./models/models"

export const createDebts = functions.firestore.document("rentals/{rentalId}").onCreate((change, _) => 
    {
        const data = change.data()

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
