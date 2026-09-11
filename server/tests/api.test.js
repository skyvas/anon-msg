// Automated API Test Suite for AnonMsg (PostgreSQL Backend)
// Tests: Auth, Public Directory, Anonymous Messaging, Named Messaging, Recipient Inbox, and Privacy Guards

const BASE_URL = 'http://localhost:3001/api';

async function runTests() {
  console.log('Starting AnonMsg API Test Suite on PostgreSQL...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.database === 'postgresql', 'Health check responds 200 with postgresql');

    // 2. Public user directory
    const usersRes = await fetch(`${BASE_URL}/users`);
    const usersData = await usersRes.json();
    assert(Array.isArray(usersData.users) && usersData.users.length >= 5, 'User directory returns seeded profiles');
    const alex = usersData.users.find(u => u.username === 'alex_dev');
    assert(alex && alex.prompt.length > 0, 'Found alex_dev with active prompt');

    // 3. Send Anonymous Message to Alex
    const anonMsgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: alex.id,
        content: 'This is an anonymous automated test message.',
        is_anonymous: true
      })
    });
    const anonMsgData = await anonMsgRes.json();
    assert(anonMsgRes.status === 201 && anonMsgData.is_anonymous === true && anonMsgData.sender_name === null, 'Sent message defaults strictly to anonymous without sender name');

    // 4. Send Named Message to Alex
    const namedMsgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: alex.id,
        content: 'Hey Alex, this is a named greeting from Jordan.',
        is_anonymous: false,
        sender_name: 'Jordan Smith'
      })
    });
    const namedMsgData = await namedMsgRes.json();
    assert(namedMsgRes.status === 201 && namedMsgData.is_anonymous === false && namedMsgData.sender_name === 'Jordan Smith', 'Sent named message preserves chosen sender name');

    // 5. Register new user
    const testUsername = `user_${Date.now()}`;
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        display_name: 'Test Pilot',
        password: 'password123',
        prompt: 'Give me your raw unfiltered thoughts'
      })
    });
    const registerData = await registerRes.json();
    assert(registerRes.status === 201 && registerData.token && registerData.user.username === testUsername, 'User registration creates account in PostgreSQL and returns valid token');
    const token = registerData.token;
    const testUserId = registerData.user.id;

    // 6. Send message to newly registered user
    const testMsgRes = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_id: testUserId,
        content: 'Confidential welcome note.',
        is_anonymous: true
      })
    });
    const testMsgData = await testMsgRes.json();
    assert(testMsgRes.status === 201, 'Successfully sent message to new user');

    // 7. Recipient Inbox isolation & analytics
    const inboxRes = await fetch(`${BASE_URL}/messages/inbox`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const inboxData = await inboxRes.json();
    assert(inboxRes.status === 200 && Array.isArray(inboxData.messages), 'Inbox endpoint returns recipient messages array');
    assert(inboxData.messages.length === 1 && inboxData.messages[0].content === 'Confidential welcome note.', 'Inbox contains exact message sent to this user');
    assert(inboxData.messages[0].ip_hash === undefined, 'Privacy Guard: ip_hash is stripped from inbox payload');
    assert(inboxData.stats.total === 1 && inboxData.stats.anonymous_count === 1, 'Inbox statistics correctly report 100% anonymous messages');

    // 8. Mark message as read
    const msgId = inboxData.messages[0].id;
    const readRes = await fetch(`${BASE_URL}/messages/inbox/${msgId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true })
    });
    const readData = await readRes.json();
    assert(readRes.status === 200 && readData.is_read === true, 'Successfully marked message as read');

    // 9. Toggle Favorite
    const favRes = await fetch(`${BASE_URL}/messages/inbox/${msgId}/favorite`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const favData = await favRes.json();
    assert(favRes.status === 200 && favData.is_favorite === true, 'Successfully starred message');

    // 10. Login as alex_dev with secure credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alex_dev', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.user.username === 'alex_dev', 'Login with secure seed credentials succeeds in PostgreSQL');

    // 11. Security Test: Rejection of short passwords (< 8 characters)
    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `short_${Date.now()}`,
        display_name: 'Short Pass User',
        password: '123'
      })
    });
    assert(shortPassRes.status === 400, 'Security Hardening: Registration rejects passwords under 8 characters');

    console.log(`\nTest Suite Summary: ${passed} Passed, ${failed} Failed\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
