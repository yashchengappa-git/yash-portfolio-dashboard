# yash-portfolio-dashboard 
(made with a lot of AI help - i dont actually know a lot about how to code, was learing while doing this)

Index.html is the mother file 
has HTML code for structure and JS code for chart logics (this uses 1 API that can be public facing. This is from logo.dev : it helps update logos based on tickers. Stuff like auto updates on the concentration chart, trade history and holdings table. 

Scripts 
backfill-stock-history.js is a one time run activity. Only left here for emergencies or chart resets. Should run it once a quarter as a best practice.
to do so go to .github/workflows -> update-prices.yml and change the source script from update-prices.js to backfill-stock-history.js. Manually run the workflow once and revert your changes.

update-prices.js this is a pretty cool one. 
it updates stock and benchmark prices once a day. Once a day due to API call limits. If my returns are good enough and I find better use for this dashboard maybe i will get a paid API key that lets me make more calls. THe API key is placed in the Settings - secrets section. This is not a public facing key, hence, we are using a reference through the script. 

update-prices.yml - this is a pure workflow file. it is scheduled to update SPY, QQQ and portfolio prices at the close of every trading day. Given that I have a free github account - the scheduled workflow mihgt not run at the exact time. Sometimes even 2-3 hours after the scheduled time. This is fine because it runs when i sleep lol.
