#!/bin/sh
# Heartbeat for the site's homelab rail. Run every 5 min (cron: */5 * * * *) on each device.
# Needs HEARTBEAT_TOKEN in the environment (e.g. from /etc/prathlab-heartbeat.env, chmod 600);
# DEVICE is pi-01 or homeserver (lib/heartbeat.ts DEVICES). Sends cpu %, mem %, SoC temp; nothing else.
set -eu
: "${HEARTBEAT_TOKEN:?set HEARTBEAT_TOKEN}"
DEVICE="${DEVICE:-pi-01}"
URL="${HEARTBEAT_URL:-https://www.prathlab.com/api/heartbeat}"

# cpu: busy share over one second, from /proc/stat
read -r _ u1 n1 s1 i1 w1 q1 sq1 _ < /proc/stat
sleep 1
read -r _ u2 n2 s2 i2 w2 q2 sq2 _ < /proc/stat
busy=$(( (u2 + n2 + s2 + q2 + sq2) - (u1 + n1 + s1 + q1 + sq1) ))
idle=$(( (i2 + w2) - (i1 + w1) ))
cpu=$(( 100 * busy / (busy + idle + 1) ))

mem=$(awk '/MemTotal/ {t=$2} /MemAvailable/ {a=$2} END {printf "%d", 100 * (t - a) / t}' /proc/meminfo)

temp=null
[ -r /sys/class/thermal/thermal_zone0/temp ] && temp=$(( $(cat /sys/class/thermal/thermal_zone0/temp) / 1000 ))

curl -fsS -m 10 -X POST "$URL" \
  -H "Authorization: Bearer $HEARTBEAT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"device\":\"$DEVICE\",\"cpu\":$cpu,\"mem\":$mem,\"temp\":$temp}"
