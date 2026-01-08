const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Migration script
const migratePaymentFields = async () => {
    try {
        await connectDB();

        const db = mongoose.connection.db;

        // STEP 1: Remove paidAmount and paymentAmount from registrations
        console.log('Removing paidAmount and paymentAmount from registrations...');

        const registrationsResult = await db.collection('registrations').updateMany(
            {},
            {
                $unset: {
                    paidAmount: "",
                    paymentAmount: ""
                }
            }
        );

        console.log('Registrations updated:', registrationsResult.modifiedCount);

        // STEP 2: Update paymentStatus from "pending" to "paid" in participants
        console.log('Updating paymentStatus from pending to paid in participants...');

        const participantsResult = await db.collection('test.participants').updateMany(
            { paymentStatus: 'pending' },
            {
                $set: {
                    paymentStatus: 'paid'
                }
            }
        );

        console.log('Participants updated:', participantsResult.modifiedCount);

        // STEP 3: Verify
        const registrationsWithOldFields = await db.collection('registrations').countDocuments({
            $or: [
                { paidAmount: { $exists: true } },
                { paymentAmount: { $exists: true } }
            ]
        });

        const participantsPending = await db.collection('test.participants').countDocuments({
            paymentStatus: 'pending'
        });

        const participantsPaid = await db.collection('test.participants').countDocuments({
            paymentStatus: 'paid'
        });

        console.log('Verification:');
        console.log('- Registrations with old fields:', registrationsWithOldFields);
        console.log('- Participants pending:', participantsPending);
        console.log('- Participants paid:', participantsPaid);
        console.log('Migration completed!');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

// Run the migration
migratePaymentFields();
