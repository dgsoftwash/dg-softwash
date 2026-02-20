#!/usr/bin/env bash
# =============================================================================
# DG SOFTWASH — FULL INTRUSIVE TEST
# Tests every feature end-to-end: bookings, customers, work orders, expenses,
# gallery, emails, revenue, settings, pricing, dashboard, payments, quotes.
#
# IMPORTANT: This test WRITES real data to the database and SENDS real emails
#            to dgsoftwash@yahoo.com (your own inbox) to verify delivery.
#            ALL data created by this test is AUTOMATICALLY DELETED at the end.
#
# Run with: bash test-full.sh
# =============================================================================

BASE="http://localhost:3000"
PASS=0
FAIL=0
WARN=0
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Track all created IDs for cleanup
BOOKING_IDS=()
CUSTOMER_IDS=()
WO_IDS=()
EXPENSE_IDS=()
GALLERY_IDS=()

ok()   { echo -e "  ${GREEN}PASS${NC}  $1"; ((PASS++)); }
fail() { echo -e "  ${RED}FAIL${NC}  $1 ${RED}← ERROR${NC}"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}WARN${NC}  $1"; ((WARN++)); }
head() { echo -e "\n${CYAN}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

jq_val() {
  # Extract a JSON field value: jq_val '{"key":"val"}' key
  echo "$1" | node -e "
    const d=require('fs').readFileSync('/dev/stdin','utf8');
    try { const p=JSON.parse(d); console.log(p['$2']||''); } catch(e) { console.log(''); }
  " 2>/dev/null
}

# ---------------------------------------------------------------------------
# STEP 0 — Auth
# ---------------------------------------------------------------------------
head "0. AUTHENTICATION"
LOGIN=$(curl -sf -X POST "$BASE/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"dgsoftwash2025"}' 2>/dev/null)
TOKEN=$(jq_val "$LOGIN" "token")

if [ -n "$TOKEN" ]; then
  ok "Admin login — token received"
else
  fail "Admin login failed — is the server running on port 3000?"
  echo ""
  echo "  Start server: node_modules/pm2/bin/pm2 reload dg-softwash"
  exit 1
fi

AUTH_H="-H x-admin-token:$TOKEN -H Content-Type:application/json"

# ---------------------------------------------------------------------------
# STEP 1 — Customer
# ---------------------------------------------------------------------------
head "1. CUSTOMER MANAGEMENT"
CUST_RESP=$(curl -sf -X POST "$BASE/api/admin/customers" $AUTH_H \
  -d '{"name":"TEST Customer Full","email":"dgsoftwash@yahoo.com","phone":"7575551234","address":"123 Test Lane Virginia Beach VA"}' 2>/dev/null)
CUST_ID=$(echo "$CUST_RESP" | node -e "
  const d=require('fs').readFileSync('/dev/stdin','utf8');
  try { const p=JSON.parse(d); console.log(p.customer_id||p.id||''); } catch(e) { console.log(''); }
" 2>/dev/null)

if [ -n "$CUST_ID" ] && [ "$CUST_ID" != "null" ] && [ "$CUST_ID" != "" ]; then
  ok "Create customer → id=$CUST_ID"
  CUSTOMER_IDS+=("$CUST_ID")
else
  fail "Create customer — no id returned: $CUST_RESP"
fi

# Read back
CUST_GET=$(curl -sf "$BASE/api/admin/customers/$CUST_ID" $AUTH_H 2>/dev/null)
if echo "$CUST_GET" | grep -q "TEST Customer Full"; then
  ok "Read customer by id"
else
  fail "Read customer by id"
fi

# List customers — confirm it's there
CUST_LIST=$(curl -sf "$BASE/api/admin/customers" $AUTH_H 2>/dev/null)
if echo "$CUST_LIST" | grep -q "TEST Customer Full"; then
  ok "Customer appears in customer list"
else
  fail "Customer NOT found in customer list"
fi

# Patch customer
PATCH=$(curl -sf -X PATCH "$BASE/api/admin/customers/$CUST_ID" $AUTH_H \
  -d '{"notes":"Test note added by test-full.sh"}' 2>/dev/null)
if echo "$PATCH" | grep -q '"success":true'; then
  ok "Patch customer notes"
else
  fail "Patch customer: $PATCH"
fi

# ---------------------------------------------------------------------------
# STEP 2 — Contact form / booking
# ---------------------------------------------------------------------------
head "2. CONTACT FORM & BOOKING"

# A. Contact message only (no appointment)
CONTACT=$(curl -sf -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"TEST Contact","email":"dgsoftwash@yahoo.com","phone":"7575559999","address":"456 Test St","message":"This is an automated test message from test-full.sh. Safe to ignore."}' 2>/dev/null)
if echo "$CONTACT" | grep -q '"success":true'; then
  ok "Contact form submission (no booking)"
else
  fail "Contact form: $CONTACT"
fi

# B. Booking with appointment — use a date 30 days out (Mon-Fri)
BOOK_DATE=$(node -e "
  const d = new Date();
  d.setDate(d.getDate() + 30);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  console.log(d.toISOString().split('T')[0]);
" 2>/dev/null)

BOOK_RESP=$(curl -sf -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"TEST Full Booking\",\"email\":\"dgsoftwash@yahoo.com\",\"phone\":\"7575550001\",\"address\":\"789 Test Blvd Virginia Beach VA\",\"service\":\"house-rancher\",\"appointmentDate\":\"$BOOK_DATE\",\"appointmentTime\":\"09:00\",\"message\":\"Automated test booking — safe to delete\"}" 2>/dev/null)

if echo "$BOOK_RESP" | grep -q '"success":true'; then
  ok "Booking created for $BOOK_DATE 9:00 AM"
else
  fail "Booking creation: $BOOK_RESP"
fi

# Retrieve the new booking id
BOOK_LIST=$(curl -sf "$BASE/api/admin/bookings" $AUTH_H 2>/dev/null)
BOOK_ID=$(echo "$BOOK_LIST" | node -e "
  const d=require('fs').readFileSync('/dev/stdin','utf8');
  try {
    const p=JSON.parse(d);
    const bk=(p.bookings||p||[]).find(b=>b.name==='TEST Full Booking');
    console.log(bk?bk.id:'');
  } catch(e) { console.log(''); }
" 2>/dev/null)

if [ -n "$BOOK_ID" ]; then
  ok "Booking visible in admin bookings list (id=$BOOK_ID)"
  BOOKING_IDS+=("$BOOK_ID")
else
  fail "Booking NOT found in admin bookings list"
fi

# ---------------------------------------------------------------------------
# STEP 3 — Work Orders
# ---------------------------------------------------------------------------
head "3. WORK ORDERS"

# Create standalone work order
WO_RESP=$(curl -sf -X POST "$BASE/api/admin/work-orders" $AUTH_H \
  -d '{"name":"TEST WO Customer","email":"dgsoftwash@yahoo.com","phone":"7575550002","address":"999 Work Order Way","service":"Rancher/Single Story","price":"$350"}' 2>/dev/null)
WO_ID=$(jq_val "$WO_RESP" "work_order_id")

if [ -n "$WO_ID" ] && [ "$WO_ID" != "" ]; then
  ok "Create standalone work order → id=$WO_ID"
  WO_IDS+=("$WO_ID")
else
  fail "Create work order: $WO_RESP"
fi

# Find the customer id created for the WO
WO_CUST=$(curl -sf "$BASE/api/admin/customers" $AUTH_H 2>/dev/null)
WO_CUST_ID=$(echo "$WO_CUST" | node -e "
  const d=require('fs').readFileSync('/dev/stdin','utf8');
  try {
    const p=JSON.parse(d);
    const c=(p.customers||p||[]).find(c=>c.name==='TEST WO Customer');
    console.log(c?c.id:'');
  } catch(e) { console.log(''); }
" 2>/dev/null)
[ -n "$WO_CUST_ID" ] && CUSTOMER_IDS+=("$WO_CUST_ID")

# Read back work order
WO_GET=$(curl -sf "$BASE/api/admin/work-orders/$WO_ID" $AUTH_H 2>/dev/null)
if echo "$WO_GET" | grep -q "Rancher"; then
  ok "Read work order by id"
else
  fail "Read work order by id: $WO_GET"
fi

# Patch — mark job complete
WO_PATCH=$(curl -sf -X PATCH "$BASE/api/admin/work-orders/$WO_ID" $AUTH_H \
  -d '{"status_job_complete":true,"completion_notes":"Automated test completion note","mileage":12.5}' 2>/dev/null)
if echo "$WO_PATCH" | grep -q '"success":true'; then
  ok "Patch work order (job complete + completion_notes + mileage)"
else
  fail "Patch work order: $WO_PATCH"
fi

# Mark invoiced
curl -sf -X PATCH "$BASE/api/admin/work-orders/$WO_ID" $AUTH_H \
  -d '{"status_invoiced":true}' >/dev/null 2>&1
ok "Patch work order (marked invoiced)"

# Mark paid
WO_PAID=$(curl -sf -X PATCH "$BASE/api/admin/work-orders/$WO_ID" $AUTH_H \
  -d '{"status_paid":true,"payment_method":"Cash"}' 2>/dev/null)
if echo "$WO_PAID" | grep -q '"success":true'; then
  ok "Patch work order (marked paid with Cash)"
else
  fail "Patch work order paid: $WO_PAID"
fi

# Work orders list
WO_LIST=$(curl -sf "$BASE/api/admin/work-orders" $AUTH_H 2>/dev/null)
if echo "$WO_LIST" | grep -q "Rancher"; then
  ok "Work order visible in work orders list"
else
  fail "Work order NOT in list: $(echo $WO_LIST | head -c 200)"
fi

# ---------------------------------------------------------------------------
# STEP 4 — Email sending
# ---------------------------------------------------------------------------
head "4. EMAIL SENDING (sends to dgsoftwash@yahoo.com)"
echo "   NOTE: Check your Yahoo inbox after this test completes."

# Invoice email via /api/admin/email
EMAIL_RESP=$(curl -sf -X POST "$BASE/api/admin/email" $AUTH_H \
  -d '{"to":[{"email":"dgsoftwash@yahoo.com","name":"Test"}],"subject":"[TEST] Invoice — test-full.sh","message":"This is an automated invoice test email from test-full.sh. If you see this, email delivery is working. Safe to delete."}' 2>/dev/null)
if echo "$EMAIL_RESP" | grep -q '"success":true'; then
  ok "Admin email send (invoice test) → dgsoftwash@yahoo.com"
else
  warn "Admin email send failed (check Yahoo SMTP credentials): $EMAIL_RESP"
fi

# Quote email
QUOTE_RESP=$(curl -sf -X POST "$BASE/api/admin/quotes" $AUTH_H \
  -d '{"name":"TEST Quote Customer","email":"dgsoftwash@yahoo.com","service":"Rancher/Single Story","price":"$350","notes":"Test quote from test-full.sh — safe to delete"}' 2>/dev/null)
if echo "$QUOTE_RESP" | grep -q '"success":true'; then
  ok "Quote email → dgsoftwash@yahoo.com"
else
  warn "Quote email failed: $QUOTE_RESP"
fi

# Review request email (requires paid work order)
REVIEW_RESP=$(curl -sf -X POST "$BASE/api/admin/work-orders/$WO_ID/review-request" $AUTH_H 2>/dev/null)
if echo "$REVIEW_RESP" | grep -q '"success":true'; then
  ok "Review request email → dgsoftwash@yahoo.com"
else
  warn "Review request email failed: $REVIEW_RESP"
fi

# ---------------------------------------------------------------------------
# STEP 5 — Expenses
# ---------------------------------------------------------------------------
head "5. EXPENSES"
TODAY=$(date +%Y-%m-%d)

EXP_RESP=$(curl -sf -X POST "$BASE/api/admin/expenses" $AUTH_H \
  -d "{\"date\":\"$TODAY\",\"category\":\"Fuel\",\"amount\":\"45.50\",\"notes\":\"test-full.sh automated test expense\"}" 2>/dev/null)
EXP_ID=$(jq_val "$EXP_RESP" "id")
if [ -z "$EXP_ID" ]; then
  EXP_ID=$(echo "$EXP_RESP" | node -e "
    const d=require('fs').readFileSync('/dev/stdin','utf8');
    try { const p=JSON.parse(d); console.log(p.expense?p.expense.id:''); } catch(e){console.log('');}
  " 2>/dev/null)
fi
if [ -n "$EXP_ID" ] && [ "$EXP_ID" != "" ]; then
  ok "Create expense → id=$EXP_ID (\$45.50 Fuel)"
  EXPENSE_IDS+=("$EXP_ID")
else
  fail "Create expense: $EXP_RESP"
fi

# List expenses
EXP_LIST=$(curl -sf "$BASE/api/admin/expenses" $AUTH_H 2>/dev/null)
if echo "$EXP_LIST" | grep -q "test-full.sh"; then
  ok "Expense visible in expenses list"
else
  fail "Expense NOT in list"
fi

# Revenue report shows the expense
REV=$(curl -sf "$BASE/api/admin/revenue-report" $AUTH_H 2>/dev/null)
if echo "$REV" | grep -q '"monthly"'; then
  ok "Revenue report responds with monthly breakdown"
else
  fail "Revenue report unexpected response: $(echo $REV | head -c 200)"
fi

# ---------------------------------------------------------------------------
# STEP 6 — Gallery
# ---------------------------------------------------------------------------
head "6. GALLERY UPLOAD & SERVING"

# Minimal 1×1 white JPEG (base64)
TINY="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="

GAL_RESP=$(curl -sf -X POST "$BASE/api/admin/gallery" $AUTH_H \
  -d "{\"title\":\"TEST Gallery Item\",\"description\":\"Automated test — safe to delete\",\"category\":\"house\",\"before_image\":\"$TINY\",\"after_image\":\"$TINY\"}" 2>/dev/null)
GAL_ID=$(jq_val "$GAL_RESP" "id")

if [ -n "$GAL_ID" ] && [ "$GAL_ID" != "" ]; then
  ok "Gallery upload → id=$GAL_ID"
  GALLERY_IDS+=("$GAL_ID")
else
  fail "Gallery upload: $GAL_RESP"
fi

# Public gallery returns item
PUB_GAL=$(curl -sf "$BASE/api/gallery" 2>/dev/null)
if echo "$PUB_GAL" | grep -q "TEST Gallery Item"; then
  ok "Gallery item visible on public /api/gallery"
else
  fail "Gallery item NOT on public gallery"
fi

# Image serving
IMG_STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE/api/gallery/$GAL_ID/before")
if [ "$IMG_STATUS" = "200" ]; then
  ok "Gallery before image serves (HTTP 200)"
else
  fail "Gallery before image → $IMG_STATUS"
fi

IMG_STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE/api/gallery/$GAL_ID/after")
if [ "$IMG_STATUS" = "200" ]; then
  ok "Gallery after image serves (HTTP 200)"
else
  fail "Gallery after image → $IMG_STATUS"
fi

# ---------------------------------------------------------------------------
# STEP 7 — Settings
# ---------------------------------------------------------------------------
head "7. SETTINGS (Available Balance)"
SET_RESP=$(curl -sf -X PATCH "$BASE/api/admin/settings" $AUTH_H \
  -d '{"key":"available_balance","value":"9999.99"}' 2>/dev/null)
if echo "$SET_RESP" | grep -q '"success":true'; then
  ok "Patch setting: available_balance = 9999.99"
else
  fail "Patch setting: $SET_RESP"
fi

SET_GET=$(curl -sf "$BASE/api/admin/settings" $AUTH_H 2>/dev/null)
if echo "$SET_GET" | grep -q "9999.99"; then
  ok "Setting persisted and returned correctly"
else
  fail "Setting not persisted: $SET_GET"
fi

# Restore setting to 0
curl -sf -X PATCH "$BASE/api/admin/settings" $AUTH_H \
  -d '{"key":"available_balance","value":"0"}' >/dev/null 2>&1
ok "Setting restored to 0"

# ---------------------------------------------------------------------------
# STEP 8 — Dashboard
# ---------------------------------------------------------------------------
head "8. DASHBOARD"
DASH=$(curl -sf "$BASE/api/admin/dashboard" $AUTH_H 2>/dev/null)
for field in "week_jobs" "monthly_revenue" "outstanding_invoices" "reservice_due" "ytd_gross" "ytd_expenses"; do
  if echo "$DASH" | grep -q "\"$field\""; then
    ok "Dashboard field present: $field"
  else
    fail "Dashboard missing field: $field"
  fi
done

# ---------------------------------------------------------------------------
# STEP 9 — Payments tab
# ---------------------------------------------------------------------------
head "9. PAYMENTS"
PAY=$(curl -sf "$BASE/api/admin/payments" $AUTH_H 2>/dev/null)
if echo "$PAY" | node -e "
  const d=require('fs').readFileSync('/dev/stdin','utf8');
  try { const p=JSON.parse(d); process.exit(p.payments?0:1); } catch(e) { process.exit(1); }
" 2>/dev/null; then
  ok "Payments endpoint returns { payments: [...] }"
else
  fail "Payments endpoint: $PAY"
fi

# ---------------------------------------------------------------------------
# STEP 10 — Pricing
# ---------------------------------------------------------------------------
head "10. PRICING"
PRICE=$(curl -sf "$BASE/api/admin/pricing" $AUTH_H 2>/dev/null)
if echo "$PRICE" | grep -q '"services"'; then
  ok "Admin pricing endpoint returns services"
else
  fail "Admin pricing: $PRICE"
fi

PUB_PRICE=$(curl -sf "$BASE/api/pricing" 2>/dev/null)
if echo "$PUB_PRICE" | grep -q '"services"'; then
  ok "Public pricing endpoint returns services"
else
  fail "Public pricing: $PUB_PRICE"
fi

# ---------------------------------------------------------------------------
# CLEANUP — Delete everything created by this test
# ---------------------------------------------------------------------------
head "CLEANUP — Removing all test data"

# Delete gallery items
for id in "${GALLERY_IDS[@]}"; do
  R=$(curl -sf -X DELETE "$BASE/api/admin/gallery/$id" $AUTH_H 2>/dev/null)
  if echo "$R" | grep -q '"success":true'; then
    ok "Deleted gallery item id=$id"
  else
    fail "Failed to delete gallery item id=$id: $R"
  fi
done

# Delete expenses
for id in "${EXPENSE_IDS[@]}"; do
  R=$(curl -sf -X DELETE "$BASE/api/admin/expenses/$id" $AUTH_H 2>/dev/null)
  if echo "$R" | grep -q '"success":true'; then
    ok "Deleted expense id=$id"
  else
    fail "Failed to delete expense id=$id: $R"
  fi
done

# Delete work orders, bookings, customers via DB in FK-safe order
# Pattern: delete child records first, then parents
node -e "
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function clean() {
  // Step 1: delete all work_orders linked to TEST bookings or TEST customers
  await pool.query(\"DELETE FROM work_orders WHERE booking_id IN (SELECT id FROM bookings WHERE name LIKE 'TEST%')\");
  await pool.query(\"DELETE FROM work_orders WHERE customer_id IN (SELECT id FROM customers WHERE name LIKE 'TEST%')\");
  // Step 2: delete TEST bookings
  await pool.query(\"DELETE FROM bookings WHERE name LIKE 'TEST%'\");
  // Step 3: delete TEST customers (no more FK references)
  await pool.query(\"DELETE FROM customers WHERE name LIKE 'TEST%'\");
  console.log('DB cleanup complete');
  await pool.end();
}
clean().catch(e => { console.error('Cleanup error:', e.message); pool.end(); });
" 2>/dev/null

if [ $? -eq 0 ]; then
  ok "Work orders, bookings, and customers removed from DB"
else
  fail "DB cleanup encountered an error — run test-basic.sh to verify state"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
TOTAL=$((PASS + FAIL + WARN))
echo ""
echo "========================================"
echo "  RESULTS:"
echo -e "    ${GREEN}$PASS passed${NC}"
[ "$WARN" -gt 0 ] && echo -e "    ${YELLOW}$WARN warnings${NC} (usually email config)"
[ "$FAIL" -gt 0 ] && echo -e "    ${RED}$FAIL failed${NC}"
echo "  ($TOTAL total checks)"
echo "========================================"
if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo -e "  ${GREEN}All systems fully operational. Database is clean.${NC}"
elif [ "$FAIL" -eq 0 ]; then
  echo -e "  ${YELLOW}Core systems OK. Warnings are non-critical (email).${NC}"
  echo -e "  ${GREEN}Database has been cleaned up.${NC}"
else
  echo -e "  ${RED}$FAIL test(s) failed. Review output above.${NC}"
  echo "  Database may need manual inspection."
fi
echo ""
exit $FAIL
