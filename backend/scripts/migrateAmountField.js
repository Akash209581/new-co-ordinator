const mongoose = require('mongoose');
const Registration = require('../models/Registration');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function migrateAmountField() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all records where paidAmount > 0 but amount is 0 or doesn't exist
        const recordsToFix = await Registration.find({
            $or: [
                { amount: 0, paidAmount: { $gt: 0 } },
                { amount: { $exists: false }, paidAmount: { $gt: 0 } }
            ]
        });

        console.log(`Found ${recordsToFix.length} records that need to be fixed\n`);

        if (recordsToFix.length === 0) {
            console.log('✅ No records need fixing!');
            await mongoose.connection.close();
            return;
        }

        console.log('Fixing records...\n');

        let fixed = 0;
        for (const record of recordsToFix) {
            const oldAmount = record.amount || 0;
            const paidAmount = record.paidAmount || 0;

            // Update amount to match paidAmount
            record.amount = paidAmount;
            await record.save();

            console.log(`✅ Fixed ${record.userId || record.registerId} - ${record.name}`);
            console.log(`   Old amount: ${oldAmount} → New amount: ${paidAmount}`);
            console.log('');

            fixed++;
        }

        console.log('='.repeat(80));
        console.log(`✅ Successfully fixed ${fixed} records!`);
        console.log('='.repeat(80));

        // Verify the fix
        console.log('\n📊 VERIFICATION:');
        const allPaid = await Registration.find({ paymentStatus: 'paid' });
        const totalFromAmount = allPaid.reduce((sum, r) => sum + (r.amount || 0), 0);
        const totalFromPaidAmount = allPaid.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

        console.log(`Total paid records: ${allPaid.length}`);
        console.log(`Total from AMOUNT field: Rs.${totalFromAmount}`);
        console.log(`Total from PAIDAMOUNT field: Rs.${totalFromPaidAmount}`);

        if (totalFromAmount === totalFromPaidAmount) {
            console.log('✅ All records are now in sync!');
        } else {
            console.log('⚠️  Warning: Totals still don\'t match. Some records may need manual review.');
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

migrateAmountField();
