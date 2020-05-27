import * as admin from 'firebase-admin'
import {Rental, Debt, Payment} from '../models/models'

admin.initializeApp()
const db = admin.firestore()


//create debts when rental is added
export const computeDebts = function (rental: Rental){
    const currentTime = new Date()
    const startMonth = Number(rental.month)
    const startYear = Number(rental.year)
    const endMonth = currentTime.getMonth() + 1
    const endYear = currentTime.getFullYear()

    const promises = []

    const debtsReference = db.collection("debts")

    loop1:
    for(let yr = startYear; yr <= endYear ; yr++){ // yr is years, mth is months

        let mth = (yr === startYear) ? startMonth : 1

        for( ; mth <= 12; mth++){
            
            if(mth > 12){
                mth = 1 //reset to first month
            }

            const year = String(yr)
            const month = String(mth).padStart(2, "0")
            const debtId = debtsReference.doc().id

            const debt: Debt = {
                debtId: debtId,
                year: year,
                month: month,
                amount: rental.amount,
                rentalId: rental.rentalId,
                propertyId: rental.propertyId
            }

            
            const addPromise = debtsReference
                                 .doc(debtId)
                                 .set(debt)
                        
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
        outstandingBalance : String(balance),
        rentalId: rentalId
    })
}


//update debt on payment
export const handleDebt = function (payment: Payment){

    return db.collection("debts")
            .where("rentalId", "==", payment.rentalId)
            .where("month", "==", payment.month)
            .where("year", "==", payment.year)
            .get()
            .then((snapshot) => {
                const doc = snapshot.docs[0]
                const debt = doc.data()

                const newBalance = Number(debt.amount) - payment.amountPaid

                if(newBalance === 0){           // if no balance is remaining
                    return doc.ref.delete()     //delete document
                }else{
                    return doc.ref.update({
                        amount : newBalance     //update debt
                    })
                }
            })
     
}

export const updateLastPayment = function(rentalId: string, dateOfPayment: string){
    return db.collection("rental_amount_summary").doc(rentalId).set(
            {
                dateOfLastPayment: dateOfPayment
            }, 
            {
                merge: true
            }
        )
}
