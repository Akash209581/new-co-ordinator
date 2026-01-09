const mongoose = require('mongoose');
const Registration = require('../models/Registration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function testAggregation() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Test the exact aggregation used in the dashboard
    const methodStats = await Registration.aggregate([
        {
            $match: { paymentStatus: 'paid' }
        },
        {
            $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
            }
        }
    ]);

    console.log('Payment Method Stats (using $amount):');
    console.log(JSON.stringify(methodStats, null, 2));

    const cashAmount = methodStats.find(m => m._id === 'cash')?.totalAmount || 0;
    const upiAmount = methodStats.find(m => m._id === 'upi')?.totalAmount || 0;
    const cashCount = methodStats.find(m => m._id === 'cash')?.count || 0;
    const upiCount = methodStats.find(m => m._id === 'upi')?.count || 0;

    console.log('\nCalculated Totals:');
    console.log('Cash: Rs.' + cashAmount + ' (' + cashCount + ' transactions)');
    console.log('UPI: Rs.' + upiAmount + ' (' + upiCount + ' transactions)');
    console.log('TOTAL: Rs.' + (cashAmount + upiAmount));

    await mongoose.connection.close();
}

testAggregation().catch(console.error);
