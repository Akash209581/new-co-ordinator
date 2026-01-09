const mongoose = require('mongoose');
const Registration = require('../models/Registration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function showPaymentStorage() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const mhids = ['MH26000479', 'MH26000149', 'MH26000005'];

    console.log('='.repeat(80));
    console.log('PAYMENT DATA STORAGE FOR YOUR 3 TRANSACTIONS');
    console.log('='.repeat(80));
    console.log('');

    for (const mhid of mhids) {
        const record = await Registration.findOne({ userId: mhid });

        if (record) {
            console.log(`${mhid} - ${record.name}`);
            console.log('  Collection: registrations');
            console.log('  Document ID: ' + record._id);
            console.log('');
            console.log('  Payment Fields:');
            console.log('    amount:         Rs.' + (record.amount || 0) + ' ← Dashboard reads this');
            console.log('    paidAmount:     Rs.' + (record.paidAmount || 0));
            console.log('    paymentAmount:  Rs.' + (record.paymentAmount || 0));
            console.log('');
            console.log('  Payment Details:');
            console.log('    paymentStatus:  ' + record.paymentStatus);
            console.log('    paymentMethod:  ' + (record.paymentMethod || 'Not set'));
            console.log('    paymentDate:    ' + (record.paymentDate || 'Not set'));
            console.log('    processedBy:    ' + (record.processedBy || 'null'));
            console.log('');
            console.log('-'.repeat(80));
            console.log('');
        }
    }

    // Show what the dashboard SHOULD display
    console.log('DASHBOARD CALCULATION:');
    console.log('='.repeat(80));
    console.log('');

    const methodStats = await Registration.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    let cashTotal = 0;
    let upiTotal = 0;
    let cashCount = 0;
    let upiCount = 0;

    methodStats.forEach(stat => {
        console.log(`Payment Method: ${stat._id || 'unknown'}`);
        console.log(`  Transactions: ${stat.count}`);
        console.log(`  Total Amount: Rs.${stat.totalAmount}`);
        console.log('');

        if (stat._id === 'cash') {
            cashTotal = stat.totalAmount;
            cashCount = stat.count;
        } else if (stat._id === 'upi') {
            upiTotal = stat.totalAmount;
            upiCount = stat.count;
        }
    });

    console.log('SUMMARY:');
    console.log(`  Cash:  ${cashCount} payments = Rs.${cashTotal}`);
    console.log(`  UPI:   ${upiCount} payments = Rs.${upiTotal}`);
    console.log(`  TOTAL: ${cashCount + upiCount} payments = Rs.${cashTotal + upiTotal}`);
    console.log('');
    console.log('This is what your dashboard SHOULD show after refresh!');

    await mongoose.connection.close();
}

showPaymentStorage().catch(console.error);
