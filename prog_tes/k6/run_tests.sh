#!/usr/bin/env bash
# ============================================================
# run_tests.sh — Wrapper CLI untuk menjalankan semua k6 test
# Usage:
#   ./run_tests.sh smoke                  → quick sanity check
#   ./run_tests.sh load                   → load test normal
#   ./run_tests.sh stress                 → stress test
#   ./run_tests.sh spike                  → spike test
#   ./run_tests.sh soak                   → soak 2 jam (jangan di CI)
#   ./run_tests.sh 100k                   → high-volume ingress
#   ./run_tests.sh 100k --vus 2000        → high-volume custom VU
# ============================================================

set -euo pipefail

# --------------- Konfigurasi ---------------
BASE_URL="${BASE_URL:-http://localhost:3001}"
ECHO_HOST="${ECHO_HOST:-http://localhost:8080}"
RESULTS_DIR="$(dirname "$0")/results"
SCRIPTS_DIR="$(dirname "$0")/scripts"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$RESULTS_DIR"

# --------------- Warna terminal ---------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; NC='\033[0m'

print_header() {
  echo -e "\n${CYAN}========================================${NC}"
  echo -e "${CYAN}  🚀 Kiosk Load Test — $1${NC}"
  echo -e "${CYAN}  BASE_URL: ${BASE_URL}${NC}"
  echo -e "${CYAN}  Timestamp: ${TIMESTAMP}${NC}"
  echo -e "${CYAN}========================================${NC}\n"
}

run_k6() {
  local script="$1"
  local label="$2"
  shift 2
  local extra_args=("$@")

  local outfile="${RESULTS_DIR}/${label}_${TIMESTAMP}_summary.json"
  local htmlfile="${RESULTS_DIR}/${label}_${TIMESTAMP}.html"

  print_header "$label"

  k6 run \
    --summary-export="${outfile}" \
    -e "BASE_URL=${BASE_URL}" \
    -e "ECHO_HOST=${ECHO_HOST}" \
    "${extra_args[@]}" \
    "${SCRIPTS_DIR}/${script}" \
    | tee "${RESULTS_DIR}/${label}_${TIMESTAMP}.log"

  echo -e "\n${GREEN}✅ Summary tersimpan di: ${outfile}${NC}"

  # Generate HTML report jika k6-reporter tersedia
  if command -v k6-reporter &>/dev/null; then
    k6-reporter --input "$outfile" --output "$htmlfile"
    echo -e "${GREEN}📊 HTML report: ${htmlfile}${NC}"
  fi
}

# --------------- Pilih skenario ---------------
SCENARIO="${1:-smoke}"
shift || true   # sisa argumen diteruskan ke k6

case "$SCENARIO" in
  smoke)
    run_k6 "01_smoke.js" "smoke" "$@"
    ;;

  load)
    run_k6 "02_load.js" "load" "$@"
    ;;

  stress)
    run_k6 "03_stress.js" "stress" "$@"
    ;;

  spike)
    run_k6 "04_spike.js" "spike" "$@"
    ;;

  soak)
    echo -e "${YELLOW}⚠️  Soak test berjalan ~2 jam. Pastikan server stabil!${NC}"
    read -p "Lanjut? (y/N) " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
    run_k6 "05_soak.js" "soak" "$@"
    ;;

  100k|ingress)
    run_k6 "06_webhook_ingress_100k.js" "ingress_100k" "$@"
    ;;

  all)
    run_k6 "01_smoke.js"  "smoke"  
    run_k6 "02_load.js"   "load"
    run_k6 "03_stress.js" "stress"
    run_k6 "04_spike.js"  "spike"
    ;;

  *)
    echo -e "${RED}❌ Skenario tidak dikenal: $SCENARIO${NC}"
    echo "Pilihan: smoke | load | stress | spike | soak | 100k | all"
    exit 1
    ;;
esac

echo -e "\n${GREEN}🎉 Test selesai!${NC}"
