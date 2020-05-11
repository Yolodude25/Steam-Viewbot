const WorkerThreads = require("worker_threads");
const request = require("request");

const checkViewcount = target => {
	request.get(`https://steamcommunity.com/broadcast/getbroadcastmpd/?steamid=${target}&viewertoken=1`, (err, res, body) => {
		
		let json = undefined;
		
		try {
			json = JSON.parse(body);
		} catch(e){return;}
		
		console.log(json.num_viewers);
	});
}

if (WorkerThreads.isMainThread) {
	const proxies = require("./proxies.json");
	const target = "76561197960313334";

	for (let i = 0; i < 10; i++) {

		let worker = new WorkerThreads.Worker(__filename, {
			workerData: {
				target: target,
				proxy: proxies[i],
				index: i + 1
			}
		});

		worker.on("online", () => console.log("Worker online"));
		worker.on("error", err => { console.error(`Bot #${worker.threadId}: ${err}`) });
		worker.on("exit", console.log);
	}
	
	setInterval(checkViewcount, 1000, target);
} else {
	const config = WorkerThreads.workerData;

	function makeViewer() {
		return new Promise((resolve, reject) => {
			request.get({ url: "https://steamcommunity.com/broadcast/getbroadcastmpd/?steamid=" + config.target, proxy: config.proxy }, (err, res, body) => {
				if (err) {
					reject(err);
					return;
				}
				
				if (body.includes('Access Denied')) {
					reject(`Access Denied`);
					return;
				} else if (!JSON.parse(body).num_viewers) {
					reject(`Invalid Response`);
					return;
				}

				if (res.statusCode !== 200) {
					reject(new Error("Invalid Status Code: " + res.statusCode));
					return;
				}

				resolve(true);
			});
		});
	}

	(async () => {
		while (true) {
			let ary = [];
			for (let i = 0; i < 100; i++) {
				ary.push(makeViewer());
			}

			let res = await Promise.all(ary).catch(err => { console.error(`Bot #${WorkerThreads.workerData.index}: ${err}`) });

			await new Promise(p => setTimeout(p, 1000));
		}
	})();
}
