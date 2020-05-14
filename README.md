# Steam Viewbot

![CSGO Viewbot Screenshot](https://i.ibb.co/w403F4w/steam-s5bp7-Ag-SSM.png)

s/o to yani and kalichan for the help

This is a viewbot that was nabbed. It was reported to Valve however Valve did not respond to their security emails.

The notorious "fake kqly" and many other cheaters use the same methodology for this. I don't care about CSGO anymore nor do I care about what goes on in CSGO anymore so as a parting gift I am releasing a few exploits that were ruining the community.

## Why are you releasing this?
I didn't want to do this but since Valve didn't patch it and I'm about to leave the CSGO community here I am releasing it.

## How does it work?
This viewbot works by spamming a Steam Broadcast URL that is used to verify the viewercount with requests from proxies. There are other methods which are far easier to use than this but I suggest you figure them out yourself. All of the other methods were reported to Valve as well but there has been nothing done to fix those. If Valve is reading this and wants to learn more about the report I sent to them, please check 708258.

## How do I use it?

This requires nodejs and a list of proxies.

1) Download this whole repo as a ZIP or use git. I was lazy and I didn't remove the node_modules folder so hf with that.

2) Enable Steam Broadcasting from the Steam Overlay (Settings -> Broadcasting)

3) Either use index.js or old.js depending on the proxy location (if the proxy is located online on a website then use index.js otherwise download all the proxies and import them into proxies.json and use old.js, or just implement it yourself cuz no one cares and im not here to help, im here to feed the mf clout that nors3 wants), replace the "const target" value inside whichever file you are using with your SteamID64 which you are streaming from. You can even use another account that has steam community permissions enabled, for that simply enable broadcasting on that other account, join your friends GOTV stream (either the cl_join_advertise 2 method for official matchmaking or use a GOTV IP) and start streaming from the GOTV connection.

4) Profit??? (Watch as the proxies requests go through and your viewers will show up on the scoreboard, may take some time tho)

## Conclusion
hope you had fun being obsessed with me nors3, the interviews can suck it all as if i give a heck about anything when i literally said im done with cs. keep wasting your time on me man, and remember to munch on them doritos.

Also, if you used this at all and you can then please donate to [@RyanAtRBM's](https://twitter.com/RyanAtRBM/) charity of choice [Movember](https://us.movember.com/donate) since everyone thinks that I am delusional for attempting to get this fixed.
