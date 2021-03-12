#!/bin/bash

URL=$1
if [ -z "$URL" ]; then
  echo -n "URL: "
  read URL  
fi

JSON='{"httpMethod": "GET", "queryStringParameters": {"url": "'$URL'", "type": "json"} }'
PAYLOAD=`echo $JSON | base64`

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

# If your target server is faulty, this can help ignore the failures
REDO_SERVER_FAILURES=$4
if [ -z "$REDO_SERVER_FAILURES" ]; then
  echo -n "Re-try on empty website reply(y/n): "
  read REDO_SERVER_FAILURES
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf $OUT &> /dev/null
mkdir -p $OUT

NOW=`date '+%Y.%m.%d-%H:%M:%S'`

runner () {
  local JOBNO=$1
  
  local TRYCOUNT=$2
  if [ -z "$TRYCOUNT" ]; then local TRYCOUNT=0; fi
  let "TRYCOUNT=TRYCOUNT+1"
  if [ "$TRYCOUNT" -gt 10 ]; then
    printf "\nRetries failed for $JOBNO\n"
    return
  fi

  local OUTFILE=$OUT/$NOW.$JOBNO.$TRYCOUNT.json
  local TMPFILE=$OUT/$NOW.$JOBNO.$TRYCOUNT.tmp.json

  aws lambda invoke --function-name lighthouse-benchmark-lambda --payload $PAYLOAD $TMPFILE > /dev/null

  node $DIR/../aws/extractBodyFromResponse.js $TMPFILE > $OUTFILE
  rm $TMPFILE

  # Sometimes lambda invoke fails
  if [ ! -s $OUTFILE ]; then
    printf "\nRe-trying $JOBNO due to lambda failure\n"
    rm $OUTFILE &> /dev/null
    runner $JOBNO $TRYCOUNT
    return
  fi
  
  # If your target server is faulty, this can help ignore the failures
  if [ "$REDO_SERVER_FAILURES" == "y" ]; then
    if [ "`jq '.runtimeError | .message' $OUTFILE | cat`" != "null" ]; then
      printf "\nRe-trying $JOBNO due to server failure\n"
      rm $OUTFILE
      runner $JOBNO $TRYCOUNT
      return
    fi
  fi
  printf "."
}


echo START
for i in $( seq 1 $COUNT ); do
  runner $i &
done
wait
printf "\nDONE\n\n"