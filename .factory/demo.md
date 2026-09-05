# ScopeStamp demo sandbox

Open <https://quote-acceptance-packet.sociobot.in/demo> or choose “Try it with
sample data” on the landing page.

The demo contains an accepted $1,750 quote from Northline Joinery to Maya Chen
for two oak studio shelving bays. It includes three exclusions, a named quote
decision, one pending $180 cable-panel change, timestamps, fingerprints, and a
three-entry event chain.

Demo records use the IndexedDB database `demo:scopestamp-local`. Real records
use `scopestamp-local`. Code in demo mode does not read the real database or
the saved license. “Reset demo” clears and recreates only the demo database.
“Start for real” clears the demo database before opening the real workspace.

The claim suite starts from empty storage and proves isolation, reset, populated
output, and offline reload through `/demo`.
