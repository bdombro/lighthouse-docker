# lighthouse-benchmark

This branch is an aws lambda function that runs a performance lighthouse audit against a url. Theoretically, this should be better than running locally bc the network and CPU is more consistent. This may be beneficial especially for websites that don't work with the Google Page Index analyzer, which provides similar feature.

i.e.
```bash
curl https://73knh84nf5.execute-api.us-east-1.amazonaws.com/default/lighthouse-benchmark?url=https://storefront:3131labs@dev02-ua03-us.sfcc.ua-ecm.com/on/demandware.store/Sites-US-Site
```

**Status**: Works locally but doesn't work in lambda. Lambda complains that there is a missing library, `libnss3.so`, which I cannot resolve despite several hours. There are other people having the same issue: https://github.com/alixaxel/chrome-aws-lambda/issues/193

Other than the bug above, the most major challenge I overcame was Lambda size limits. Our app is too be to include the chrome exe, so I had to engineer a workflow to download it on-demand.

wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install ./google-chrome-stable_current_amd64.deb