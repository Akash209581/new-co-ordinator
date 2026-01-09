const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function checkPayments() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const registrations = db.collection('registrations');

        // Check the specific MHIDs mentioned
        const mhids = ['MH26000479', 'MH26000149', 'MH26000005'];

        console.log('Checking payment records for: ' + mhids.join(', '));
        console.log('================================================================================\n');

        for (const mhid of mhids) {
            const record = await registrations.findOne({
                $or: [
                    { userId: mhid },
                    { registerId: mhid }
                ]
            });

            if (record) {
                console.log('Record for ' + mhid + ':');
                console.log('  Name: ' + record.name);
                console.log('  Payment Status: ' + record.paymentStatus);
                console.log('  Payment Amount: ' + (record.paymentAmount || 0));
                console.log('  Paid Amount: ' + (record.paidAmount || 0));
                console.log('  Payment Method: ' + (record.paymentMethod || 'Not set'));
                console.log('  Processed By: ' + (record.processedBy || 'null'));
                console.log('');
            } else {
                console.log('No record found for ' + mhid + '\n');
            }
        }

        // Check ALL paid registrations
        console.log('\nALL PAID REGISTRATIONS:');
        console.log('================================================================================\n');

        const allPaid = await registrations.find({
            paymentStatus: 'paid'
        }).toArray();

        console.log('Total paid registrations: ' + allPaid.length + '\n');

        let totalAmount = 0;
        allPaid.forEach((record, index) => {
            const amount = record.paidAmount || 0;
            totalAmount += amount;
            console.log((index + 1) + '. ' + (record.userId || record.registerId) + ' - ' + record.name);
            console.log('   Paid Amount: ' + amount);
            console.log('   Payment Method: ' + (record.paymentMethod || 'Not set'));
            console.log('');
        });

        console.log('GRAND TOTAL COLLECTED: Rs. ' + totalAmount);

        await mongoose.connection.close();
        console.log('\nConnection closed');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkPayments();
