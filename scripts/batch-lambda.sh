#!/bin/bash

SET_COUNT=5 # 5 seems like the magic number for not overwhelming the URL
NOW=`date '+%Y.%m.%d-%H:%M:%S'`

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
OUT="$OUT/$NOW"

# If your target server is faulty, this can help ignore the failures
REDO_SERVER_FAILURES=$3
if [ -z "$REDO_SERVER_FAILURES" ]; then
  REDO_SERVER_FAILURES=y
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

rm -rf $OUT &> /dev/null

audit () {
  local setNo=$1
  local jobNo=$2
  local tryNo=$3

  if [ -z "$tryNo" ]; then local tryNo=0; fi
  let "tryNo=tryNo+1"
  if [ "$tryNo" -gt 10 ]; then
    printf "\nRetries failed for $jobNo\n"
    return
  fi

  local setPath=$OUT/$setNo
  rm -rf $setPath &> /dev/null
  mkdir -p $setPath
  local outFile=$setPath/$NOW.$jobNo.$tryNo.json
  local tmpFile=$outFile.tmp

  aws lambda invoke --function-name lighthouse-benchmark-lambda --payload $PAYLOAD $tmpFile > /dev/null

  node $DIR/../aws/extractBodyFromResponse.js $tmpFile > $outFile
  rm $tmpFile

  # Sometimes lambda invoke fails
  if [ ! -s $outFile ]; then
    printf "\nRe-trying $jobNo due to lambda failure\n"
    rm $outFile &> /dev/null
    audit $setNo $jobNo $tryNo
    return
  fi
  
  # If your target server is faulty, this can help ignore the failures
  if [ "$REDO_SERVER_FAILURES" == "y" ]; then
    if [ "`jq '.runtimeError | .message' $outFile | cat`" != "null" ]; then
      printf "\nRe-trying $jobNo due to server failure\n"
      rm $outFile
      audit $setNo $jobNo $tryNo
      return
    fi
  fi
}

createAuditSet () {
  local setNo=$1
  printf "¶ Set-$setNo:   "
  for jobNo in $( seq 1 $SET_COUNT ); do
    audit $setNo $jobNo &
  done
  wait
  printf "✅\n"
}

main () {
  printf "¶ Warm-up: "
  audit 0 0
  printf "✅\n"
  for i in $( seq 1 4 ); do
    createAuditSet $i
  done
  printf "¶ DONE\n"
}

main