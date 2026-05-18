# yash-portfolio-dashboard 
(made with a lot of AI help - i dont actually know a lot about how to code, was learing while doing this)

Index.html is the mother file 

has HTML code for structure and JS code for chart logics (this uses 1 API that can be public facing. This is from logo.dev : it helps update logos based on tickers. Stuff like auto updates on the concentration chart, trade history and holdings table. 

Scripts 

backfill-stock-history.js is a one time run activity. Only left here for emergencies or chart resets. Should run it once a quarter as a best practice.
to do so go to .github/workflows -> update-prices.yml and change the source script from update-prices.js to backfill-stock-history.js. Manually run the workflow once and revert your changes.

update-prices.js this is a pretty cool one. 
it updates stock and benchmark prices once a day. Once a day due to API call limits. If my returns are good enough and I find better use for this dashboard maybe i will get a paid API key that lets me make more calls. THe API key is placed in the Settings - secrets section. This is not a public facing key, hence, we are using a reference through the script. 

Workflows

update-prices.yml - this is a pure workflow file. it is scheduled to update SPY, QQQ and portfolio prices at the close of every trading day. Given that I have a free github account - the scheduled workflow mihgt not run at the exact time. Sometimes even 2-3 hours after the scheduled time. This is fine because it runs when i sleep lol.


PSA - NEED TO UPDATE SOME Node stuff before September 2026
Node.js 20 actions are deprecated. The following actions are running on Node.js 20 and may not work as expected: actions/checkout@v4, actions/upload-artifact@v4. Actions will be forced to run with Node.js 24 by default starting June 2nd, 2026. Node.js 20 will be removed from the runner on September 16th, 2026. Please check if updated versions of these actions are available that support Node.js 24. To opt into Node.js 24 now, set the FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true environment variable on the runner or in your workflow file. Once Node.js 24 becomes the default, you can temporarily opt out by setting ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true. For more information see: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
