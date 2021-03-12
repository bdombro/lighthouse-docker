#!/bin/sh

# Switch betwene emulator and prod based on AWS set env var
# ref: https://docs.aws.amazon.com/lambda/latest/dg/images-test.html#images-test-alternative

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  exec /usr/local/bin/aws-lambda-rie /function/node_modules/.bin/aws-lambda-ric lambda.handler
else
  exec /function/node_modules/.bin/aws-lambda-ric lambda.handler
fi