/**
 * D&G Soft Wash — Automated API Test Suite
 * Tests all endpoints in the admin feature expansion.
 *
 * Usage:
 *   node tests/api-test.js
 *
 * Requirements:
 *   - Server running on localhost:3000
 *   - Set ADMIN_PASSWORD env var if not using default, e.g.:
 *       ADMIN_PASSWORD=yourpassword node tests/api-test.js
 */

const BASE = 'http://localhost:3000';
const PASSWORD = process.env.ADMIN_PASSWORD || 'dgsoftwash2025';

let token = null;
let passed = 0;
let failed = 0;
const failures = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function pass(name) {
  console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  passed++;
}

function fail(name, reason) {
  console.log(`  \x1b[31m✗\x1b[0m ${name}`);
  console.log(`    \x1b[33m→ ${reason}\x1b[0m`);
  failed++;
  failures.push({ name, reason });
}

function assert(name, condition, reason) {
  condition ? pass(name) : fail(name, reason);
}

function section(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`);
}

// ─── Test groups ────────────────────────────────────────────────────────────

async function testLogin() {
  section('Login');
  const { status, data } = await api('POST', '/api/admin/login', { password: PASSWORD });
  if (data.success && data.token) {
    token = data.token;
    pass('Login with correct password returns token');
  } else {
    fail('Login with correct password returns token', `status=${status} success=${data.success}`);
    console.log('\n\x1b[31mCannot continue without a valid token. Check ADMIN_PASSWORD.\x1b[0m\n');
    process.exit(1);
  }

  const { data: bad } = await api('POST', '/api/admin/login', { password: 'wrongpassword' });
  assert('Login with wrong password fails', !bad.success, 'Expected success=false');
}

async function testDashboard() {
  section('Dashboard');
  const { status, data } = await api('GET', '/api/admin/dashboard');
  assert('Dashboard returns 200', status === 200, `status=${status}`);
  assert('Dashboard has recurring_due array', Array.isArray(data.recurring_due), `recurring_due=${JSON.stringify(data.recurring_due)}`);
  assert('Dashboard has week_jobs', Array.isArray(data.week_jobs), 'missing week_jobs');
  assert('Dashboard has outstanding_invoices', Array.isArray(data.outstanding_invoices), 'missing outstanding_invoices');
}

async function testArAging() {
  section('AR Aging');
  const { status, data } = await api('GET', '/api/admin/analytics/ar-aging');
  assert('AR aging returns 200', status === 200, `status=${status}`);
  assert('Has current bucket', Array.isArray(data.current), `current=${data.current}`);
  assert('Has late bucket', Array.isArray(data.late), `late=${data.late}`);
  assert('Has pastdue bucket', Array.isArray(data.pastdue), `pastdue=${data.pastdue}`);
}

async function testReferrals() {
  section('Referral Analytics');
  const { status, data } = await api('GET', '/api/admin/analytics/referrals');
  assert('Referrals returns 200', status === 200, `status=${status}`);
  assert('Referrals is an array', Array.isArray(data), `data=${JSON.stringify(data)}`);
}

async function testCustomerReferralSource() {
  section('Customer — Referral Source');

  const { data: custData } = await api('GET', '/api/admin/customers');
  if (!custData.customers || custData.customers.length === 0) {
    fail('Referral source patch', 'No customers in DB — create one first');
    return null;
  }
  const cust = custData.customers[0];

  const { status, data } = await api('PATCH', '/api/admin/customers/' + cust.id, {
    referral_source: 'Google Search'
  });
  assert('PATCH customers/:id with referral_source returns 200', status === 200, `status=${status}`);
  assert('Response has success=true', data.success === true, `success=${data.success}`);

  // Verify persisted
  const { data: detail } = await api('GET', '/api/admin/customers/' + cust.id);
  assert('referral_source persisted in DB', detail.customer.referral_source === 'Google Search',
    `got: ${detail.customer.referral_source}`);

  // Cleanup
  await api('PATCH', '/api/admin/customers/' + cust.id, { referral_source: '' });

  return cust.id;
}

async function testWorkOrderTimeTracking() {
  section('Work Order — Time Tracking');

  // Create a temporary work order so this test is self-contained
  const { data: woData } = await api('GET', '/api/admin/work-orders');
  let woId = null;
  let createdByTest = false;

  if (woData.work_orders && woData.work_orders.length > 0) {
    woId = woData.work_orders[0].id;
  } else {
    // Create one — needs at least one customer in DB
    const { data: custData } = await api('GET', '/api/admin/customers');
    if (!custData.customers || custData.customers.length === 0) {
      fail('actual_start/actual_end patch', 'No work orders or customers in DB');
      return;
    }
    const c = custData.customers[0];
    const { data: created } = await api('POST', '/api/admin/work-orders', {
      name: c.name, email: c.email, phone: c.phone, address: c.address,
      service: 'Test Service', price: '100', notes: 'Automated test WO'
    });
    if (!created.work_order_id) {
      fail('actual_start/actual_end patch', 'Failed to create temp work order');
      return;
    }
    woId = created.work_order_id;
    createdByTest = true;
  }

  // Patch time fields
  const { status, data } = await api('PATCH', '/api/admin/work-orders/' + woId, {
    actual_start: '09:00',
    actual_end: '11:30'
  });
  assert('PATCH work-orders/:id with actual_start/end returns 200', status === 200, `status=${status}`);
  assert('Response has success=true', data.success === true, `success=${data.success}`);

  // Verify persisted
  const { data: detail } = await api('GET', '/api/admin/work-orders/' + woId);
  assert('actual_start persisted', detail.actual_start === '09:00', `got: ${detail.actual_start}`);
  assert('actual_end persisted', detail.actual_end === '11:30', `got: ${detail.actual_end}`);

  // Verify duration = 150 min (9:00 → 11:30)
  const expectedMin = 150;
  const { data: analyticsData } = await api('GET', '/api/admin/analytics/time-tracking');
  const tracked = (analyticsData.tracked_jobs || []).find(j => j.id === woId);
  assert('time-tracking analytics includes patched WO', !!tracked, `WO#${woId} not in tracked_jobs`);
  assert('duration_min calculated correctly (150 min)', tracked && tracked.duration_min === expectedMin,
    `got: ${tracked && tracked.duration_min}`);

  // Cleanup — clear times, or delete if we created it
  if (createdByTest) {
    await api('DELETE', '/api/admin/work-orders/' + woId);
  } else {
    await api('PATCH', '/api/admin/work-orders/' + woId, { actual_start: '', actual_end: '' });
  }
}

async function testTimeTrackingAnalytics() {
  section('Time Tracking Analytics Endpoint');

  const { status, data } = await api('GET', '/api/admin/analytics/time-tracking');
  assert('GET /api/admin/analytics/time-tracking returns 200', status === 200, `status=${status}`);
  assert('Response has tracked_jobs array', Array.isArray(data.tracked_jobs),
    `tracked_jobs=${JSON.stringify(data.tracked_jobs)}`);
  assert('Response has by_service array', Array.isArray(data.by_service),
    `by_service=${JSON.stringify(data.by_service)}`);

  // Verify shape of any existing entries
  if (data.tracked_jobs.length > 0) {
    const j = data.tracked_jobs[0];
    assert('tracked_job has id', typeof j.id === 'number', `id=${j.id}`);
    assert('tracked_job has duration_min > 0', j.duration_min > 0, `duration_min=${j.duration_min}`);
    assert('tracked_job has actual_start string', typeof j.actual_start === 'string', `actual_start=${j.actual_start}`);
    assert('tracked_job has actual_end string', typeof j.actual_end === 'string', `actual_end=${j.actual_end}`);
  } else {
    pass('tracked_jobs is empty array (no time-tracked WOs yet) — shape OK');
  }

  if (data.by_service.length > 0) {
    const s = data.by_service[0];
    assert('by_service entry has service string', typeof s.service === 'string', `service=${s.service}`);
    assert('by_service entry has avg_minutes number', typeof s.avg_minutes === 'number', `avg_minutes=${s.avg_minutes}`);
    assert('by_service entry has count number', typeof s.count === 'number', `count=${s.count}`);
  }

  // Verify LEFT JOIN works — manually-created WOs (no booking_id) must be included
  // This is tested implicitly: if a tracked_job has no date it came from a booking-less WO
  const noDateWo = data.tracked_jobs.find(j => !j.date || j.date === '');
  if (noDateWo) {
    pass('Manually-created WO (no booking) included in tracked_jobs via LEFT JOIN');
  }
}

async function testWorkOrderDelete() {
  section('Work Order — Delete');

  // Create a throwaway work order
  const { data: custData } = await api('GET', '/api/admin/customers');
  if (!custData.customers || custData.customers.length === 0) {
    fail('Work order delete', 'No customers in DB — create one first');
    return;
  }
  const c = custData.customers[0];
  const { data: created } = await api('POST', '/api/admin/work-orders', {
    name: c.name, email: c.email, phone: c.phone, address: c.address,
    service: 'Delete Test Service', price: '50', notes: 'Automated delete test'
  });
  assert('Created temp WO for delete test', !!created.work_order_id, `data=${JSON.stringify(created)}`);
  if (!created.work_order_id) return;

  const woId = created.work_order_id;

  // Verify it exists
  const { status: getStatus } = await api('GET', '/api/admin/work-orders/' + woId);
  assert('WO exists before delete', getStatus === 200, `status=${getStatus}`);

  // Delete it
  const { status: delStatus, data: delData } = await api('DELETE', '/api/admin/work-orders/' + woId);
  assert('DELETE /api/admin/work-orders/:id returns 200', delStatus === 200, `status=${delStatus}`);
  assert('Delete response has success=true', delData.success === true, `success=${delData.success}`);

  // Verify gone from list
  const { data: listData } = await api('GET', '/api/admin/work-orders');
  const stillExists = (listData.work_orders || []).some(w => w.id === woId);
  assert('Deleted WO no longer appears in work-orders list', !stillExists, 'WO still in list after delete');

  // Verify 404 on direct fetch
  const { status: afterDelStatus } = await api('GET', '/api/admin/work-orders/' + woId);
  assert('Deleted WO returns 404 on direct fetch', afterDelStatus === 404, `got: ${afterDelStatus}`);

  // Verify deleting a non-existent WO returns 404
  const { status: missingStatus } = await api('DELETE', '/api/admin/work-orders/' + woId);
  assert('DELETE non-existent WO returns 404', missingStatus === 404, `got: ${missingStatus}`);
}

async function testRecurringServices() {
  section('Recurring Services');

  const { data: custData } = await api('GET', '/api/admin/customers');
  if (!custData.customers || custData.customers.length === 0) {
    fail('Recurring services', 'No customers in DB');
    return;
  }
  const customerId = custData.customers[0].id;

  // Create
  const today = new Date().toISOString().split('T')[0];
  const { status: createStatus, data: created } = await api('POST', '/api/admin/recurring', {
    customer_id: customerId,
    service: 'House Wash Test',
    interval: 'quarterly',
    last_service_date: today,
    notes: 'Automated test entry'
  });
  assert('POST /api/admin/recurring returns 200', createStatus === 200, `status=${createStatus}`);
  assert('Created recurring has id', !!(created.recurring && created.recurring.id), `data=${JSON.stringify(created)}`);

  if (!created.recurring) return;
  const recId = created.recurring.id;

  // Verify next_due_date (~3 months out) — API may return full ISO string or date-only
  const nextDue = new Date(created.recurring.next_due_date);
  const expectedDue = new Date(today + 'T12:00:00');
  expectedDue.setMonth(expectedDue.getMonth() + 3);
  const diffDays = Math.abs((nextDue - expectedDue) / (1000 * 60 * 60 * 24));
  assert('next_due_date is ~3 months from last_service_date', diffDays < 2,
    `next_due=${created.recurring.next_due_date}, expected ~${expectedDue.toISOString().split('T')[0]}`);

  // List
  const { status: listStatus, data: list } = await api('GET', '/api/admin/recurring');
  assert('GET /api/admin/recurring returns 200', listStatus === 200, `status=${listStatus}`);
  assert('List contains the new entry', list.some(r => r.id === recId), 'Entry not found in list');

  // Mark serviced
  const { status: svcStatus } = await api('PATCH', '/api/admin/recurring/' + recId, {
    mark_serviced: true
  });
  assert('PATCH mark_serviced returns 200', svcStatus === 200, `status=${svcStatus}`);

  // Verify last_service_date updated
  const { data: updatedList } = await api('GET', '/api/admin/recurring');
  const updated = updatedList.find(r => r.id === recId);
  if (updated) {
    const newLastSvc = updated.last_service_date ? updated.last_service_date.split('T')[0] : '';
    assert('last_service_date updated to today after mark_serviced', newLastSvc === today,
      `got: ${newLastSvc}`);
  }

  // PATCH other fields
  const { status: patchStatus } = await api('PATCH', '/api/admin/recurring/' + recId, {
    notes: 'Updated notes',
    interval: 'annual'
  });
  assert('PATCH notes/interval returns 200', patchStatus === 200, `status=${patchStatus}`);

  // Soft delete
  const { status: delStatus } = await api('DELETE', '/api/admin/recurring/' + recId);
  assert('DELETE /api/admin/recurring/:id returns 200', delStatus === 200, `status=${delStatus}`);

  // Verify gone from active list
  const { data: afterDel } = await api('GET', '/api/admin/recurring');
  assert('Deleted entry no longer in active list', !afterDel.some(r => r.id === recId),
    'Entry still in active list after delete');
}

async function testPurchaseOrders() {
  section('Purchase Orders');

  const items = [
    { desc: 'Soft wash solution', qty: 2, unit_price: 45.00 },
    { desc: 'Spray nozzle', qty: 1, unit_price: 12.50 }
  ];
  const expectedTotal = (2 * 45) + (1 * 12.50); // 102.50

  const today = new Date().toISOString().split('T')[0];
  const { status: createStatus, data: created } = await api('POST', '/api/admin/purchase-orders', {
    date: today,
    vendor: 'Test Vendor Co.',
    items,
    total: expectedTotal,
    status: 'draft',
    notes: 'Automated test PO'
  });
  assert('POST /api/admin/purchase-orders returns 200', createStatus === 200, `status=${createStatus}`);
  assert('Created PO has id', !!(created.po && created.po.id), `data=${JSON.stringify(created)}`);

  if (!created.po) return;
  const poId = created.po.id;
  const poNumber = created.po.po_number;

  // Verify PO number format PO-YYYY-NNN
  const yearStr = today.substring(0, 4);
  assert(`PO number format is PO-${yearStr}-NNN`, /^PO-\d{4}-\d{3}$/.test(poNumber),
    `got: ${poNumber}`);

  // List
  const { status: listStatus, data: list } = await api('GET', '/api/admin/purchase-orders');
  assert('GET /api/admin/purchase-orders returns 200', listStatus === 200, `status=${listStatus}`);
  assert('List contains new PO', list.some(p => p.id === poId), 'PO not found in list');

  // Get single
  const { status: getStatus, data: single } = await api('GET', '/api/admin/purchase-orders/' + poId);
  assert('GET /api/admin/purchase-orders/:id returns 200', getStatus === 200, `status=${getStatus}`);
  assert('Single PO has correct vendor', single.vendor === 'Test Vendor Co.', `got: ${single.vendor}`);
  assert('Single PO has correct total', parseFloat(single.total) === expectedTotal,
    `got: ${single.total}`);

  // PATCH status
  await api('PATCH', '/api/admin/purchase-orders/' + poId, { status: 'ordered', notes: 'Order placed' });
  const { data: afterPatch } = await api('GET', '/api/admin/purchase-orders/' + poId);
  assert('Status updated to ordered', afterPatch.status === 'ordered', `got: ${afterPatch.status}`);
  assert('Notes updated', afterPatch.notes === 'Order placed', `got: ${afterPatch.notes}`);

  // PATCH items
  const newItems = [...items, { desc: 'Brush attachment', qty: 1, unit_price: 22.00 }];
  const { status: itemPatchStatus } = await api('PATCH', '/api/admin/purchase-orders/' + poId, {
    items: newItems,
    total: expectedTotal + 22.00
  });
  assert('PATCH line items returns 200', itemPatchStatus === 200, `status=${itemPatchStatus}`);

  // Delete
  const { status: delStatus } = await api('DELETE', '/api/admin/purchase-orders/' + poId);
  assert('DELETE /api/admin/purchase-orders/:id returns 200', delStatus === 200, `status=${delStatus}`);

  const { status: afterDelStatus } = await api('GET', '/api/admin/purchase-orders/' + poId);
  assert('Deleted PO returns 404', afterDelStatus === 404, `got: ${afterDelStatus}`);

  // PO number sequencing
  const { data: po2 } = await api('POST', '/api/admin/purchase-orders', {
    date: today, vendor: 'Seq Test A', items: [], total: 0, status: 'draft', notes: ''
  });
  const { data: po3 } = await api('POST', '/api/admin/purchase-orders', {
    date: today, vendor: 'Seq Test B', items: [], total: 0, status: 'draft', notes: ''
  });
  if (po2.po && po3.po) {
    const num2 = parseInt(po2.po.po_number.split('-')[2]);
    const num3 = parseInt(po3.po.po_number.split('-')[2]);
    assert('PO numbers are unique', po2.po.po_number !== po3.po.po_number,
      `Both got ${po2.po.po_number}`);
    await api('DELETE', '/api/admin/purchase-orders/' + po2.po.id);
    await api('DELETE', '/api/admin/purchase-orders/' + po3.po.id);
  }
}

async function testUnauthorized() {
  section('Auth — Unauthorized access blocked');
  const savedToken = token;
  token = 'invalid-token-xyz';

  const endpoints = [
    ['GET',    '/api/admin/dashboard'],
    ['GET',    '/api/admin/analytics/ar-aging'],
    ['GET',    '/api/admin/analytics/referrals'],
    ['GET',    '/api/admin/analytics/time-tracking'],
    ['GET',    '/api/admin/recurring'],
    ['GET',    '/api/admin/purchase-orders'],
    ['DELETE', '/api/admin/work-orders/1'],
  ];
  for (const [method, path] of endpoints) {
    const { status } = await api(method, path);
    assert(`${method} ${path} returns 401 with bad token`, status === 401, `got ${status}`);
  }
  token = savedToken;
}

// ─── Run all ─────────────────────────────────────────────────────────────────

async function run() {
  console.log('\x1b[1m\nD&G Soft Wash — API Test Suite\x1b[0m');
  console.log('Target: ' + BASE);
  console.log('─'.repeat(45));

  try {
    await testLogin();
    await testDashboard();
    await testArAging();
    await testReferrals();
    await testCustomerReferralSource();
    await testWorkOrderTimeTracking();
    await testTimeTrackingAnalytics();
    await testWorkOrderDelete();
    await testRecurringServices();
    await testPurchaseOrders();
    await testUnauthorized();
  } catch (err) {
    console.error('\n\x1b[31mUnexpected error:\x1b[0m', err.message);
    failed++;
  }

  console.log('\n' + '─'.repeat(45));
  console.log(`\x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m  (${passed + failed} total)\n`);

  if (failures.length > 0) {
    console.log('\x1b[31mFailed tests:\x1b[0m');
    failures.forEach(f => console.log(`  • ${f.name}\n    ${f.reason}`));
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
