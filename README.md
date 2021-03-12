# lighthouse-docker

A simple nodejs micro-service that runs Lighthouse benchmarks. There are two versions: http server and lambda server.

# Table-O-Contents

- [Use-Cases:](#use-cases)
- [Context and Why?](#context-and-why)
- [Alternatives:](#alternatives)
- [Usage](#usage)
- [HTTP Server](#http-server)
- [Lambda Server](#lambda-server)
- [FAQs](#faqs)


# Use-Cases:

1. CI/CD: Create reports during CI/CD
2. Shared Benchmarks - more consistent than running locally b/c local machines and networks differ drammatically.
3. Stress testing benchmarks - when using Lambda, you can launch hundreds of concurrent audits


# Context and Why?

### Intro

Back in the 90s, the complexity of web pages tiny. If you looked a typical website, such as this one at ref #1, the total download size is less than 40 kilobytes (kB). Fast forward to today, and the average website is more than 2000kB (see ref #2). For mobile users and those with limited internet options, 2000kB would easily take 10+ seconds.

As companies are becoming more and more aware of the benefits of speed and accessibility, many are turning to the free-and-open-source (FOSS) Lighthouse audit tool backed by Google. Lighthouse is one of the first and best audit tools for websites, because it produces clear and actionable audits when used correctly. Therein lies the trick though -- using Lighthouse correctly is hard and involves unclear trade-offs.

### Decision #1: What websites should we audit?

While public-facing websites seem obvious to audit, audits on internal websites such as staging and development websites can also be useful. For example, most public-facing websites release features in batches, which make it impossible to observe the impact of a specific new feature with audits alone. To make up for this, many companies choose to also audit internal websites. What websites one chooses to audit impacts decision #2…

### Decision #2: What computers or servers to run the audit from and how?

The location and capabilities of the server directly impact the audit results, and therefore degrade the value of any comparison where conditions are not exactly the same. So much so, that the Lighthouse developers themselves recommend over-investing in server infrastructure to approach consistency between audits, by running them on dedicated machines where no more than one audit can be running simultaneously (ref #5).

Meanwhile, some websites are non-public and require custom engineering to allow the auditing computer to access.

### Decision #3: What to do with the metrics that Lighthouse produces?

Lighthouse produces a lot of metrics, some of which are useful as-is, some are useful with some manipulation, some are not very useful.

Many metrics involve the addition of other metrics, which make it hard to compare a specific metric between audits. A good example is Largest Contentful Paint (LCP). LCP The time at which the image/text on the screen starts to settle. LCP is a valuable metric for software performance, but is useless when comparing one audit to another because of webserver influence. Mainly, LCP is highly influenced by the time it takes for the web-server to reply to page requests, also known as Time-to-First-Byte (SRT). The research demonstrated in ref #6 that metrics like LCP become useful when adjusted for TTFB.

Decision #4: Does combining multiple audits together improve precision, and if so how many?

Yes! Averaging is a great start, and can be made even better when accounting for botched audits. In ref #6, we utilize Standard Deviation to identify and reduce the impact of botched audits.

### Conclusion

The normalization and averaging techniques used in this spreadsheet demonstrate that acceptable precision is achievable when:

- Normalizing over a set of 5 sequential audits using the formulae in ref #6
- Following some/all of the guidelines from the Lighthouse developers

### Context Refs:

1. http://home.mcom.com/home/welcome.html
2. https://httparchive.org/reports/state-of-the-web
3. https://www.pcmag.com/news/these-us-rural-areas-have-the-highest-and-lowest-internet-speeds
4. https://development-us.sfcc.ua-ecm.com/en-us/
5. https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md
6. https://docs.google.com/spreadsheets/d/1AUJbCPpkFL-_tY8mOTT69uE64EEeMx1hB7hT-bnVRFY/edit?usp=sharing


# Alternatives:
1. https://developers.google.com/speed/docs/insights/v5/get-started#cli
2. https://www.webpagetest.org/
 
# Usage

See package.json scripts for a variety of usage scripts. Also see the scripts folder for batch audits

Example for creating a summary report for before and after a change:

```sh
# Before running the next line, prepare the sandbox for a "before" snapshot
./scripts/batch-lambda.sh https://example.com before 20

# Before running the next line, prepare the sandbox for an "after" snapshot
./scripts/batch-lambda.sh https://example.com after 20

# Run summarize-reports.ts to generate a summary CSV
npx ts-node scripts/summarize-reports.ts before after > summarize-reports.csv

# Checkout summarize-reports.csv! I've been pasting it into spreadsheet https://docs.google.com/spreadsheets/d/1dKlFAFLnrzKIgnJXmGDHsrToXNuvA8JSNzHNDg3S8tU/edit?usp=sharing
```

# HTTP Server

A nodejs server that uses Node's http server library. It listens for GET requests with a query string param options:

1. url - the url to test. Pro-tip: You can include basic auth if you follow the pattern `https://username:password@example.com`
2. type - optional param to specify output formal. Options = [html,json] with default html

Entrypoint: server.js


# Lambda Server

Pretty much the same app but exports Lambda handlers to be compatible with Lambda. Note that this app won't work with AWS API Gateway because it imposes a 10 seconds timeout on API requests.

One way to call it directly is using the aws cli, see aws/trigger-lambda.sh for an example.

# FAQs

- Q: Will this work on websites that require basic auth?

  A: Yes, if you follow the pattern `https://username:password@example.com`

- Q: Will this work on websites that have self-signed or broken SSL certs?

  A: Yes, broken SSL is ignored