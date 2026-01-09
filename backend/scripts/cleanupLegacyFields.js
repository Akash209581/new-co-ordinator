const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function cleanupLegacyFields() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const registrations = db.collection('registrations');

        // Count records with legacy fields
        const withPaidAmount = await registrations.countDocuments({ paidAmount: { $exists: true } });
        const withPaymentAmount = await registrations.countDocuments({ paymentAmount: { $exists: true } });

        console.log(`Records with paidAmount field: ${withPaidAmount}`);
        console.log(`Records with paymentAmount field: ${withPaymentAmount}\n`);

        if (withPaidAmount === 0 && withPaymentAmount === 0) {
            console.log('✅ No legacy fields found. Database is already clean!');
            await mongoose.connection.close();
            return;
        }

        console.log('🧹 Removing legacy fields...\n');

        // Remove paidAmount and paymentAmount fields from all documents
        const result = await registrations.updateMany(
            {},
            {
                $unset: {
                    paidAmount: '',
                    paymentAmount: ''
                }
            }
        );

        console.log('='.repeat(80));
        console.log(`✅ Successfully cleaned ${result.modifiedCount} records!`);
        console.log('='.repeat(80));

        // Verify cleanup
        const stillHasPaidAmount = await registrations.countDocuments({ paidAmount: { $exists: true } });
        const stillHasPaymentAmount = await registrations.countDocuments({ paymentAmount: { $exists: true } });

        console.log('\n📊 VERIFICATION:');
        console.log(`Records still with paidAmount: ${stillHasPaidAmount}`);
        console.log(`Records still with paymentAmount: ${stillHasPaymentAmount}`);

        if (stillHasPaidAmount === 0 && stillHasPaymentAmount === 0) {
            console.log('\n✅ All legacy fields have been removed!');
            console.log('✅ Database now uses only the "amount" field for payments.');
        } else {
            console.log('\n⚠️  Warning: Some records still have legacy fields.');
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupLegacyFields();
