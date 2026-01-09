const mongoose = require('mongoose');
const TeamRegistration = require('../models/TeamRegistration');
require('dotenv').config();

const fixTeamData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Update Team Name for TM000001
        const targetTeamId = 'TM000001';
        const newName = 'akash';

        const team = await TeamRegistration.findOne({ teamId: targetTeamId });
        if (team) {
            console.log(`Found team ${targetTeamId}. Current Name: '${team.teamName}'`);
            team.teamName = newName;
            await team.save();
            console.log(`✅ Updated team name to: '${newName}'`);
        } else {
            console.log(`⚠️ Team ${targetTeamId} not found.`);
        }

        // 2. Remove paidAmount field from all teams
        console.log('\nRemoving paidAmount field from all teams...');
        const result = await TeamRegistration.updateMany(
            {},
            { $unset: { paidAmount: "" } }
        );
        console.log(`✅ Removed paidAmount from ${result.modifiedCount} teams (matched ${result.matchedCount}).`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    }
};

fixTeamData();
