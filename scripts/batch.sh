#!/bin/sh

URL=$1
if [ -z "$URL" ]; then
  echo -n "URL: "
  read URL  
fi

OUT=$2
if [ -z "$OUT" ]; then
  echo -n "Output Dir: "
  read OUT
fi

COUNT=$3
if [ -z "$COUNT" ]; then
  echo -n "Count: "
  read COUNT
fi

LH_URL=$4
if [ -z "$LH_URL" ]; then
  LH_URL=localhost:8080
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf $OUT &> /dev/null
mkdir -p $OUT

for i in $( seq 1 $COUNT ); do
  NOW=`date '+%Y.%m.%d-%H:%M:%S'`
  echo "Rep #$i > $OUT/$NOW.json"
  curl -o $OUT/$NOW.json "$LH_URL?url=$URL&type=json" > null
done