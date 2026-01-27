/**
 * Test script for webhook server
 * Usage: node test.js
 */

const axios = require('axios');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'test_token';

// Test data
const testSignals = {
    buy: {
        action: "BUY",
        symbol: "BTCUSDT",
        price: 45000,
        stop_loss: 44100,
        take_profit: 46800,
        risk_percent: 1,
        timestamp: Date.now().toString()
    },
    sell: {
        action: "SELL",
        symbol: "ETHUSDT",
        price: 3000,
        stop_loss: 3090,
        take_profit: 2850,
        risk_percent: 1,
        timestamp: Date.now().toString()
    }
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

async function testHealthEndpoint() {
    console.log(colors.blue + '\n=== Testing Health Endpoint ===' + colors.reset);

    try {
        const response = await axios.get(`${SERVER_URL}/health`);
        console.log(colors.green + '✓ Health check passed' + colors.reset);
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error(colors.red + '✗ Health check failed' + colors.reset);
        console.error('Error:', error.message);
        return false;
    }
}

async function testWebhookEndpoint(signal, description) {
    console.log(colors.blue + `\n=== Testing Webhook: ${description} ===${colors.reset}`);

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (WEBHOOK_TOKEN) {
            headers['X-Webhook-Token'] = WEBHOOK_TOKEN;
        }

        console.log('Sending signal:', JSON.stringify(signal, null, 2));

        const response = await axios.post(
            `${SERVER_URL}/webhook`,
            signal,
            { headers }
        );

        console.log(colors.green + `✓ ${description} signal processed successfully` + colors.reset);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error(colors.red + `✗ ${description} signal failed` + colors.reset);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        return false;
    }
}

async function testUnauthorizedAccess() {
    console.log(colors.blue + '\n=== Testing Unauthorized Access ===' + colors.reset);

    try {
        const response = await axios.post(
            `${SERVER_URL}/webhook`,
            testSignals.buy,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Token': 'wrong_token'
                }
            }
        );

        console.log(colors.red + '✗ Security test failed - unauthorized access allowed' + colors.reset);
        return false;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log(colors.green + '✓ Security test passed - unauthorized access blocked' + colors.reset);
            return true;
        } else {
            console.error(colors.red + '✗ Unexpected error during security test' + colors.reset);
            console.error('Error:', error.message);
            return false;
        }
    }
}

async function testInvalidData() {
    console.log(colors.blue + '\n=== Testing Invalid Data Handling ===' + colors.reset);

    const invalidSignals = [
        {
            data: { action: "INVALID_ACTION", symbol: "BTCUSDT", price: 45000 },
            description: "Invalid action type"
        },
        {
            data: { action: "BUY", price: 45000 },
            description: "Missing symbol"
        },
        {
            data: { action: "BUY", symbol: "BTCUSDT" },
            description: "Missing price"
        },
        {
            data: "BUY:BTCUSDT:45000:44000:46000",
            description: "Text format signal"
        }
    ];

    let allPassed = true;

    for (const testCase of invalidSignals) {
        console.log(`\nTesting: ${testCase.description}`);

        try {
            const headers = {
                'Content-Type': testCase.description === "Text format signal" ? 'text/plain' : 'application/json'
            };

            if (WEBHOOK_TOKEN) {
                headers['X-Webhook-Token'] = WEBHOOK_TOKEN;
            }

            const response = await axios.post(
                `${SERVER_URL}/webhook`,
                testCase.data,
                { headers }
            );

            if (testCase.description === "Text format signal") {
                console.log(colors.green + `✓ ${testCase.description} - processed` + colors.reset);
            } else {
                console.log(colors.yellow + `⚠ ${testCase.description} - accepted (check validation)` + colors.reset);
            }
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log(colors.green + `✓ ${testCase.description} - correctly rejected` + colors.reset);
            } else {
                console.error(colors.red + `✗ ${testCase.description} - unexpected error` + colors.reset);
                allPassed = false;
            }
        }
    }

    return allPassed;
}

async function testPositionsEndpoint() {
    console.log(colors.blue + '\n=== Testing Positions Endpoint ===' + colors.reset);

    try {
        const response = await axios.get(`${SERVER_URL}/positions`);
        console.log(colors.green + '✓ Positions endpoint accessible' + colors.reset);
        console.log('Current positions:', response.data);
        return true;
    } catch (error) {
        console.error(colors.red + '✗ Positions endpoint failed' + colors.reset);
        console.error('Error:', error.message);
        return false;
    }
}

async function testOrdersEndpoint() {
    console.log(colors.blue + '\n=== Testing Orders Endpoint ===' + colors.reset);

    try {
        const response = await axios.get(`${SERVER_URL}/orders`);
        console.log(colors.green + '✓ Orders endpoint accessible' + colors.reset);
        console.log('Current orders:', response.data);
        return true;
    } catch (error) {
        console.error(colors.red + '✗ Orders endpoint failed' + colors.reset);
        console.error('Error:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log(colors.yellow + '=' . repeat(50) + colors.reset);
    console.log(colors.yellow + 'Webhook Server Test Suite' + colors.reset);
    console.log(colors.yellow + '=' . repeat(50) + colors.reset);
    console.log('Server URL:', SERVER_URL);
    console.log('Using webhook token:', WEBHOOK_TOKEN ? 'Yes' : 'No');

    const results = {
        health: await testHealthEndpoint(),
        security: WEBHOOK_TOKEN ? await testUnauthorizedAccess() : true,
        buySignal: await testWebhookEndpoint(testSignals.buy, 'BUY'),
        sellSignal: await testWebhookEndpoint(testSignals.sell, 'SELL'),
        validation: await testInvalidData(),
        positions: await testPositionsEndpoint(),
        orders: await testOrdersEndpoint()
    };

    // Summary
    console.log(colors.yellow + '\n' + '=' . repeat(50) + colors.reset);
    console.log(colors.yellow + 'Test Summary' + colors.reset);
    console.log(colors.yellow + '=' . repeat(50) + colors.reset);

    let passed = 0;
    let failed = 0;

    for (const [test, result] of Object.entries(results)) {
        if (result) {
            console.log(colors.green + `✓ ${test}` + colors.reset);
            passed++;
        } else {
            console.log(colors.red + `✗ ${test}` + colors.reset);
            failed++;
        }
    }

    console.log(`\nTotal: ${passed + failed} tests, ${colors.green}${passed} passed${colors.reset}, ${colors.red}${failed} failed${colors.reset}`);

    if (failed === 0) {
        console.log(colors.green + '\n✨ All tests passed! ✨' + colors.reset);
    } else {
        console.log(colors.red + '\n⚠️  Some tests failed. Please check the errors above.' + colors.reset);
    }

    process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServerConnection() {
    try {
        await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
        return true;
    } catch (error) {
        return false;
    }
}

// Main execution
(async () => {
    console.log('Checking server connection...');

    const isConnected = await checkServerConnection();

    if (!isConnected) {
        console.error(colors.red + '\n❌ Cannot connect to server at ' + SERVER_URL + colors.reset);
        console.log('\nPlease make sure the server is running:');
        console.log('1. Navigate to webhook_server directory');
        console.log('2. Run: npm install');
        console.log('3. Run: npm start');
        console.log('\nThen run this test again.');
        process.exit(1);
    }

    console.log(colors.green + 'Server is running!' + colors.reset);

    // Wait a bit before starting tests
    setTimeout(() => {
        runAllTests();
    }, 1000);
})();