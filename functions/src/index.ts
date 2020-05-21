import * as functions from 'firebase-functions';
import {computeDebts} from "./util-methods/create-debts"
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

        return computeDebts(rental).catch((err) => {
            console.error(err)
            return Promise.reject(`${err}`)
        })
    }
)
