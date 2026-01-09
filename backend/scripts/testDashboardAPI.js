// Test the dashboard stats endpoint
const https = require('https');
const http = require('http');

async function testDashboardAPI() {
    // You'll need to replace TOKEN with your actual auth token from localStorage
    const token = 'YOUR_AUTH_TOKEN_HERE';

    const options = {
        hostname: 'localhost',
        port: 5005, // Try 5005 first (what frontend uses)
        path: '/api/coordinator/dashboard/stats',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    console.log('Testing API endpoint: http://localhost:5005/api/coordinator/dashboard/stats\n');

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('Response Status:', res.statusCode);
                console.log('\nPayment Statistics:');
                console.log('  Total Amount Collected:', json.data?.stats?.totalAmountCollected || 0);
                console.log('  Cash Amount:', json.data?.stats?.cashAmount || 0);
                console.log('  UPI Amount:', json.data?.stats?.upiAmount || 0);
                console.log('  Total Payments Processed:', json.data?.stats?.totalPaymentsProcessed || 0);
                console.log('\nFull stats object:');
                console.log(JSON.stringify(json.data?.stats, null, 2));
            } catch (e) {
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Error:', e.message);
        console.log('\nTrying port 5000 instead...\n');

        // Try port 5000
        options.port = 5000;
        const req2 = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                console.log('Port 5000 response:', data.substring(0, 200));
            });
        });
        req2.on('error', (e2) => console.error('Port 5000 also failed:', e2.message));
        req2.end();
    });

    req.end();
}

console.log('NOTE: You need to get your auth token from the browser localStorage');
console.log('Open browser console and run: localStorage.getItem("authToken")');
console.log('Then replace YOUR_AUTH_TOKEN_HERE in this script\n');

// testDashboardAPI();
