const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

async function fixPayments() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const registrations = db.collection('registrations');

        // The MHIDs that need to be fixed
        const mhids = ['MH26000479', 'MH26000149', 'MH26000005'];

        console.log('🔧 Fixing payment amounts for:', mhids.join(', '));
        console.log('='.repeat(80) + '\n');

        for (const mhid of mhids) {
            const record = await registrations.findOne({ userId: mhid });

            if (!record) {
                console.log(`❌ Record not found for ${mhid}`);
                continue;
            }

            console.log(`📝 Processing ${mhid} - ${record.name}`);
            console.log(`   Current paidAmount: ₹${record.paidAmount || 0}`);
            console.log(`   Payment Status: ${record.paymentStatus}`);

            // Calculate the correct fee
            let fee = 200; // Default fee

            if (record.userType === 'visitor') {
                fee = 200;
            } else if (record.userType === 'participant') {
                // Check if they're from Vignan
                if (record.college && record.college.toLowerCase().includes('vignan')) {
                    fee = 150; // Vignan students pay 150
                } else {
                    fee = 200; // Non-Vignan students pay 200
                }
            }

            console.log(`   Calculated fee: ₹${fee}`);

            // Update the record
            const result = await registrations.updateOne(
                { userId: mhid },
                {
                    $set: {
                        paidAmount: fee,
                        paymentAmount: fee,
                        paymentMethod: record.paymentMethod || 'cash', // Default to cash if not set
                        paymentDate: record.paymentDate || new Date()
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`   ✅ Updated successfully - Set paidAmount to ₹${fee}\n`);
            } else {
                console.log(`   ⚠️  No changes made\n`);
            }
        }

        // Verify the changes
        console.log('\n📊 VERIFICATION:');
        console.log('='.repeat(80) + '\n');

        const allPaid = await registrations.find({ paymentStatus: 'paid' }).toArray();
        let totalAmount = 0;
        let cashTotal = 0;
        let upiTotal = 0;

        allPaid.forEach((record) => {
            const amount = record.paidAmount || 0;
            totalAmount += amount;

            if (record.paymentMethod === 'cash') {
                cashTotal += amount;
            } else if (record.paymentMethod === 'upi') {
                upiTotal += amount;
            }

            console.log(`${record.userId} - ${record.name}: ₹${amount} (${record.paymentMethod || 'unknown'})`);
        });

        console.log('\n💰 TOTALS:');
        console.log(`   Cash: ₹${cashTotal}`);
        console.log(`   UPI: ₹${upiTotal}`);
        console.log(`   GRAND TOTAL: ₹${totalAmount}`);

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixPayments();
