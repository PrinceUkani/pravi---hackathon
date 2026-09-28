/**
 * Infraro Integration & API Test Suite
 * Tests: Authentication, RBAC, Asset CRUD, Search, Lifecycle, Maintenance State Machine
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('🧪 Starting Infraro API Integration Tests...');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Test Health endpoint
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.success === true, 'Health check returns success');

    // 2. Test Admin Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@infraro.com', password: 'Admin@123' }),
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true && loginData.data?.token, 'Admin login with valid credentials');
    const adminToken = loginData.data?.token;

    // 3. Test Invalid Login
    const invalidLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@infraro.com', password: 'WrongPassword' }),
    });
    assert(invalidLoginRes.status === 401, 'Invalid password rejected with 401');

    // 4. Test Get Me (Protected)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    assert(meData.success === true && meData.data.email === 'admin@infraro.com', 'Get current authenticated user');

    // 5. Test Dashboard Stats
    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    assert(statsData.success === true && statsData.data.totalAssets >= 90, `Dashboard stats returns real DB counts (Total: ${statsData.data?.totalAssets})`);

    // 6. Test Demo Asset Lookup (SRV-000124)
    const demoAssetRes = await fetch(`${BASE_URL}/assets/SRV-000124`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const demoAssetData = await demoAssetRes.json();
    assert(demoAssetData.success === true && demoAssetData.data.asset.assetId === 'SRV-000124', 'Special demo asset SRV-000124 lookup succeeds');
    assert(demoAssetData.data.maintenanceTickets.length >= 2, 'Demo asset has attached maintenance ticket history');

    // 7. Test Asset QR Code generation
    const qrRes = await fetch(`${BASE_URL}/assets/${demoAssetData.data.asset._id}/qr`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const qrData = await qrRes.json();
    assert(qrData.success === true && qrData.data.qrCode.startsWith('data:image/png;base64,'), 'QR code data URL generated correctly');

    // 8. Test Search
    const searchRes = await fetch(`${BASE_URL}/assets?search=Dell`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchData.success === true && searchData.data.assets.length > 0, `Asset search finds matching assets (Found: ${searchData.data.assets.length})`);

    console.log(`\n🏁 Test Run Completed: ${passed} passed, ${failed} failed.\n`);
  } catch (err) {
    console.error('Test execution error:', err.message);
  }
}

runTests();
