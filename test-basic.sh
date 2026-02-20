#!/usr/bin/env bash
# =============================================================================
# DG SOFTWASH — BASIC FUNCTIONALITY TEST
# Non-intrusive: reads data, checks connectivity, verifies endpoints respond.
# Does NOT write, modify, or delete any data.
# Run with: bash test-basic.sh
# =============================================================================

BASE="http://localhost:3000"
PASS=0
FAIL=0
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}PASS${NC}  $1"; ((PASS++)); }
fail() { echo -e "  ${RED}FAIL${NC}  $1"; ((FAIL++)); }
head() { echo -e "\n${YELLOW}==> $1${NC}"; }

# ---------------------------------------------------------------------------
# 0. Login — get admin token (read-only from here on)
# ---------------------------------------------------------------------------
head "AUTH"
LOGIN=$(curl -sf -X POST "$BASE/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"dgsoftwash2025"}' 2>/dev/null)
TOKEN=$(echo "$LOGIN" | node -e "try{const d=require('fs').readFileSync('/dev/stdin','utf8');console.log(JSON.parse(d).token||'')}catch(e){console.log('')}" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  ok "Admin login returns token"
else
  fail "Admin login failed — is the server running on port 3000?"
  echo ""
  echo "  TIP: Start the server first with:"
  echo "       node_modules/pm2/bin/pm2 reload dg-softwash"
  echo ""
  exit 1
fi

# Bad password should be rejected
BAD=$(curl -sf -X POST "$BASE/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"wrongpassword"}' 2>/dev/null)
if echo "$BAD" | grep -q '"success":false'; then
  ok "Bad password rejected"
else
  fail "Bad password was NOT rejected (security issue)"
fi

# ---------------------------------------------------------------------------
# 1. Public pages — HTML responses
# ---------------------------------------------------------------------------
head "PUBLIC PAGES"
for route in "/" "/services" "/pricing" "/gallery" "/contact"; do
  STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE$route")
  if [ "$STATUS" = "200" ]; then
    ok "GET $route → 200"
  else
    fail "GET $route → $STATUS (expected 200)"
  fi
done

# Admin page
STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE/admin")
if [ "$STATUS" = "200" ]; then
  ok "GET /admin → 200"
else
  fail "GET /admin → $STATUS"
fi

# ---------------------------------------------------------------------------
# 2. Public API
# ---------------------------------------------------------------------------
head "PUBLIC API"

# Pricing endpoint
PRICING=$(curl -sf "$BASE/api/pricing" 2>/dev/null)
if echo "$PRICING" | grep -q '"services"'; then
  SCOUNT=$(echo "$PRICING" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');const p=JSON.parse(d);console.log(p.services?p.services.length:0)" 2>/dev/null)
  ok "GET /api/pricing → returns $SCOUNT services"
else
  fail "GET /api/pricing → unexpected response"
fi

# Availability for a near-future date
FUTURE=$(node -e "const d=new Date();d.setDate(d.getDate()+14);console.log(d.toISOString().split('T')[0])" 2>/dev/null)
AVAIL=$(curl -sf "$BASE/api/availability/$FUTURE/slots" 2>/dev/null)
if echo "$AVAIL" | grep -q '"available"'; then
  ok "GET /api/availability/$FUTURE/slots → responds"
else
  fail "GET /api/availability/$FUTURE/slots → unexpected response"
fi

# Monthly availability
YEAR=$(date +%Y)
MONTH=$(date +%m)
MAVAIL=$(curl -sf "$BASE/api/availability/$YEAR/$MONTH" 2>/dev/null)
if echo "$MAVAIL" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');try{const p=JSON.parse(d);process.exit(typeof p==='object'?0:1)}catch(e){process.exit(1)}" 2>/dev/null; then
  ok "GET /api/availability/$YEAR/$MONTH → responds"
else
  fail "GET /api/availability/$YEAR/$MONTH → unexpected response"
fi

# Gallery public endpoint
GALLERY=$(curl -sf "$BASE/api/gallery" 2>/dev/null)
if echo "$GALLERY" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');try{const p=JSON.parse(d);process.exit(Array.isArray(p)?0:1)}catch(e){process.exit(1)}" 2>/dev/null; then
  ok "GET /api/gallery → returns array"
else
  fail "GET /api/gallery → unexpected response"
fi

# ---------------------------------------------------------------------------
# 3. Admin API — read-only checks
# ---------------------------------------------------------------------------
head "ADMIN API (READ-ONLY)"
AUTH="-H x-admin-token:$TOKEN"

for endpoint in \
  "/api/admin/dashboard" \
  "/api/admin/bookings" \
  "/api/admin/customers" \
  "/api/admin/work-orders" \
  "/api/admin/expenses" \
  "/api/admin/revenue-report" \
  "/api/admin/payments" \
  "/api/admin/settings" \
  "/api/admin/gallery" \
  "/api/admin/pricing"; do
  STATUS=$(curl -so /dev/null -w "%{http_code}" $AUTH "$BASE$endpoint" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    ok "GET $endpoint → 200"
  else
    fail "GET $endpoint → $STATUS (expected 200)"
  fi
done

# ---------------------------------------------------------------------------
# 4. Auth protection — endpoints must reject requests with no token
# ---------------------------------------------------------------------------
head "AUTH PROTECTION"
for endpoint in \
  "/api/admin/dashboard" \
  "/api/admin/customers" \
  "/api/admin/settings"; do
  STATUS=$(curl -so /dev/null -w "%{http_code}" "$BASE$endpoint" 2>/dev/null)
  if [ "$STATUS" = "401" ]; then
    ok "$endpoint blocks unauthenticated requests"
  else
    fail "$endpoint returned $STATUS (expected 401 without token)"
  fi
done

# ---------------------------------------------------------------------------
# 5. Dashboard data structure
# ---------------------------------------------------------------------------
head "DASHBOARD DATA STRUCTURE"
DASH=$(curl -sf $AUTH "$BASE/api/admin/dashboard" 2>/dev/null)
for field in "week_jobs" "monthly_revenue" "outstanding_invoices" "reservice_due" "ytd_gross" "ytd_expenses"; do
  if echo "$DASH" | grep -q "\"$field\""; then
    ok "Dashboard has field: $field"
  else
    fail "Dashboard missing field: $field"
  fi
done

# ---------------------------------------------------------------------------
# 6. Database connectivity
# ---------------------------------------------------------------------------
head "DATABASE"
CUST=$(curl -sf $AUTH "$BASE/api/admin/customers" 2>/dev/null)
if echo "$CUST" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');try{JSON.parse(d);process.exit(0)}catch(e){process.exit(1)}" 2>/dev/null; then
  ok "Database reachable (customers endpoint returned valid JSON)"
else
  fail "Database connectivity issue — invalid response from customers"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
TOTAL=$((PASS + FAIL))
echo ""
echo "========================================"
echo "  RESULTS: $PASS passed, $FAIL failed (of $TOTAL checks)"
echo "========================================"
if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}All systems operational.${NC}"
else
  echo -e "  ${RED}$FAIL check(s) failed — review output above.${NC}"
fi
echo ""
exit $FAIL
