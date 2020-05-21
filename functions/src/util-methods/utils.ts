import * as admin from 'firebase-admin'
import {Rental, Debt} from '../models/models'

admin.initializeApp()
const db = admin.firestore()

export const computeDebts = function (rental: Rental){
    const currentTime = new Date()
    const startMonth = Number(rental.month)
    const startYear = Number(rental.year)
    const endMonth = currentTime.getMonth() + 1
    const endYear = currentTime.getFullYear()

    const promises = []

    loop1:
    for(let yr = startYear; yr <= endYear ; yr++){ // yr is years, mth is months

        let mth = (yr === startYear) ? startMonth : 1

        for( ; mth <= 12; mth++){
            
            if(mth > 12){
                mth = 1 //reset to first month
            }

            const year = String(yr)
            const month = String(mth).padStart(2, "0")

            const debt: Debt = {
                year: year,
                month: month,
                amount: rental.amount,
                rentalId: rental.rentalId,
                propertyId: rental.propertyId
            }

            
            const addPromise = db.collection("debts")
                                    .add(debt)
                        
            promises.push(addPromise)

            if(yr === endYear && mth === endMonth){
                break loop1 
            }
        }
    
    }
    
    return Promise.all(promises)
 
}

export const calculateInitialOutstandingBalance = async function (amount: number, rentalId: string){
    const docReference = db.collection("rental_account_summary").doc(rentalId)
    
    let size = 0

    try {
        size = (await db.collection("debts").where("rentalId", "==", rentalId).get()).size
    } catch (error) {
        console.error("ERR in getting number of docs", error)
    }
    
    const balance = amount * size

    return docReference.set({
        outstandingBalance : String(balance)
    })
}
