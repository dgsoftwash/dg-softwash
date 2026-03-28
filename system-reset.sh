#!/bin/bash
# System Reset Script for D&G Softwash Server Widget
# Resets services and clears temporary files

echo "$(date): Starting system reset..."

# Clear temporary files and sync filesystem
echo "Clearing temporary files..."
sync
rm -rf /tmp/dg-softwash-* 2>/dev/null || true

# Kill any zombie processes
echo "Checking for zombie processes..."
pgrep -f dg-softwash | head -5

# Wait a moment
sleep 2

# Reload the main application
echo "Reloading DG Softwash application..."
pm2 reload dg-softwash

# Check memory status
echo "Current memory status:"
vm_stat | head -2

echo "$(date): System reset complete"