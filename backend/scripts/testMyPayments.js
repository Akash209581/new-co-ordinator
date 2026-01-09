const mongoose = require('mongoose');
const Registration = require('../models/Registration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function testMyPayments() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find first coordinator (or any user really, just to check data structure)
        // We'll just look at paid registrations directly
        const paidRegs = await Registration.find({ paymentStatus: 'paid' }).limit(5);

        console.log(`\nChecking ${paidRegs.length} paid registrations for 'amount' field...`);

        paidRegs.forEach(reg => {
            console.log(`\nID: ${reg.userId || reg.registerId}`);
            console.log(`Name: ${reg.name}`);
            console.log(`Amount: ${reg.amount} (Type: ${typeof reg.amount})`);
            console.log(`PaidAmount: ${reg.paidAmount} (Should be undefined)`);
            console.log(`PaymentAmount: ${reg.paymentAmount} (Should be undefined)`);

            if (reg.amount > 0) {
                console.log('✅ Amount is present and positive');
            } else {
                console.log('❌ Amount is 0 or missing');
            }
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testMyPayments();
