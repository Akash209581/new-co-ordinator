const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function checkPayments() {
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const registrations = db.collection('registrations');

    // Check specific MHIDs
    const mhids = ['MH26000479', 'MH26000149', 'MH26000005'];

    for (const mhid of mhids) {
        const record = await registrations.findOne({ userId: mhid });
        if (record) {
            console.log(JSON.stringify({
                userId: record.userId,
                name: record.name,
                paymentStatus: record.paymentStatus,
                paymentAmount: record.paymentAmount,
                paidAmount: record.paidAmount,
                paymentMethod: record.paymentMethod,
                processedBy: record.processedBy
            }, null, 2));
        }
    }

    // Get all paid
    const allPaid = await registrations.find({ paymentStatus: 'paid' }).toArray();
    console.log('\nTotal paid count:', allPaid.length);
    console.log('Total amount:', allPaid.reduce((sum, r) => sum + (r.paidAmount || 0), 0));

    await mongoose.connection.close();
}

checkPayments().catch(console.error);
