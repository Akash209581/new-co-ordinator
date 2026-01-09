const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function checkAmountField() {
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const registrations = db.collection('registrations');

    const mhids = ['MH26000479', 'MH26000149', 'MH26000005'];

    console.log('Checking AMOUNT field for paid transactions:\n');

    for (const mhid of mhids) {
        const record = await registrations.findOne({ userId: mhid });
        if (record) {
            console.log(mhid + ' - ' + record.name);
            console.log('  paymentStatus: ' + record.paymentStatus);
            console.log('  amount: ' + (record.amount || 0));
            console.log('  paidAmount: ' + (record.paidAmount || 0));
            console.log('  paymentAmount: ' + (record.paymentAmount || 0));
            console.log('  paymentMethod: ' + (record.paymentMethod || 'Not set'));
            console.log('');
        }
    }

    const allPaid = await registrations.find({ paymentStatus: 'paid' }).toArray();
    const totalFromAmount = allPaid.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalFromPaidAmount = allPaid.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    console.log('Total paid records: ' + allPaid.length);
    console.log('Total from AMOUNT field: Rs. ' + totalFromAmount);
    console.log('Total from PAIDAMOUNT field: Rs. ' + totalFromPaidAmount);

    await mongoose.connection.close();
}

checkAmountField().catch(console.error);
