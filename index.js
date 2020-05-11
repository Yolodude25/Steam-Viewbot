const WorkerThreads = require("worker_threads");
const request = require("request");
const serializeError = require("serialize-error");

const checkViewcount = async (target) => {
	let json = await requestJSON("https://steamcommunity.com/broadcast/getbroadcastinfo/?steamid=" + target).catch(() => {});
	if (!json) {
		return;
	}

	console.log(new Date().toTimeString() + " | Viewers: " + json.response.viewer_count);
}

const fetchProxies = (urls = ["http://spys.me/proxy.txt"]) => {
	return new Promise(async (resolve, reject) => {
		let proxies = [];
		let finished = 0;

		for (let url of urls) {
			request(url, (err, res, body) => {
				if (err) {
					finished += 1;
					return;
				}

				if (res.statusCode !== 200) {
					finished += 1;
					return;
				}

				let matches = body.match(/(\d+(\.|)){4}:\d+/gm);
				proxies.push(matches);
			});
		}

		while (finished + proxies.length < urls.length) {
			await new Promise(p => setTimeout(p, 500));
		}

		resolve(proxies.flat());
	});
}

const verifyProxies = (proxies, url = "https://steamcommunity.com/broadcast/getbroadcastmpd") => {
	return new Promise(async (resolve, reject) => {
		let working = [];
		let finished = 0;

		for (let proxy of proxies) {
			if (!proxy.startsWith("http://")) {
				proxy = "http://" + proxy;
			}

			requestJSON({
				uri: url,
				proxy: proxy,
				timeout: 10000
			}, 400, 30000).then((res) => {
				if (Array.isArray(res.response)) {
					working.push(res.options.proxy);
				}

				finished += 1;
			}).catch((err) => {
				if (err.type === "failParse") {
					working.push(err.options.proxy);
				}

				finished += 1;
			});
		}

		let prev = 0;
		while (finished < proxies.length) {
			if (prev !== finished) {
				console.log("Checks finished: " + finished + "/" + proxies.length + ", working proxies: " + working.length);
				prev = finished;
			}

			await new Promise(p => setTimeout(p, 1000));
		}

		resolve(working);
	});
}

const requestJSON = (opts, expectedStatusCode = 200, forceTimeout = undefined) => {
	return new Promise((resolve, reject) => {
		let timeout = undefined;
		let r = undefined;

		if (typeof forceTimeout === "number") {
			timeout = setTimeout(() => {
				r.abort();
				reject({
					type: "noTimeout",
					options: opts
				});
			}, forceTimeout);
		}

		r = request(opts, (err, res, body) => {
			if (typeof forceTimeout === "number") {
				clearTimeout(timeout);
			}

			if (err) {
				reject({
					type: "error",
					error: err,
					options: opts
				});
				return;
			}

			if (res.statusCode !== expectedStatusCode) {
				reject({
					type: "statusCode",
					statusCode: res.statusCode,
					options: opts
				});
				return;
			}

			let json = undefined;
			try {
				json = JSON.parse(body);
				resolve({
					type: "success",
					response: json,
					options: opts
				});
			} catch (err) {
				reject({
					type: "failParse",
					error: err,
					options: opts
				});
			}
		});

		r.once("error", (err) => {
			reject({
				type: "fatal",
				error: err,
				options: opts
			});
		});
	});
}

(async () => {
	if (WorkerThreads.isMainThread) {
		// Config
		const target = "76561198040501116";
		const workers = 10;

		// Needed vars
		let curProxy = 0;

		// Get proxies and verify them
		let proxies = await fetchProxies();
		console.log("Got " + proxies.length + " proxies, verifying...");

		proxies = await verifyProxies(proxies);
		console.log("Got " + proxies.length + " working proxies");

		require("fs").writeFileSync("proxies.json", JSON.stringify(proxies));

		if (proxies.length <= 0) {
			console.log("No proxies available");
			return;
		}

		if (proxies.length < workers) {
			console.log("We have " + proxies.length + " proxies but need " + workers);
			return;
		}

		setInterval(checkViewcount, 5000, target);

		for (let i = 0; i < workers; i++) {
			let worker = new WorkerThreads.Worker(__filename, {
				workerData: {
					target: target,
					proxy: proxies[curProxy++]
				}
			});

			worker.on("online", () => console.log("Worker online"));
			worker.on("error", console.error);
			worker.on("exit", console.log);
			worker.on("message", (msg) => {
				switch (msg.type) {
					case "failProxy": {
						console.log("Worker " + worker.threadId + "'s proxy failed, getting new one...");

						let newCurProxy = curProxy++;
						if (newCurProxy >= proxies.length) {
							console.log("Wrapping around proxies, continuing at 0");
							newCurProxy = 0;
							curProxy = 1;
						}

						worker.postMessage({
							type: "newProxy",
							proxy: proxies[newCurProxy]
						})
						break;
					}
					default: {
						console.log(msg);
					}
				}
			});
		}
	} else {
		const config = WorkerThreads.workerData;
		let waitForProxy = false;

		WorkerThreads.parentPort.on("message", (msg) => {
			switch (msg.type) {
				case "newProxy": {
					config.proxy = msg.proxy;
					waitForProxy = false;
					break;
				}
			}
		});

		const makeViewer = () => {
			return new Promise(async (resolve, reject) => {
				await requestJSON({
					uri: "https://steamcommunity.com/broadcast/getbroadcastmpd/?steamid=" + config.target,
					proxy: config.proxy
				}, 200, 3000).catch((err) => {
					if (err.type === "noTimeout") {
						resolve();
						return;
					}

					if (err.type === "error") {
						if (err.error.code === "ECONNRESET") {
							resolve();
							return;
						}
					}

					waitForProxy = true;
					WorkerThreads.parentPort.postMessage({
						type: "failProxy"
					});

					reject(err);
				});

				resolve();
			});
		}

		while (true) {
			while (waitForProxy) {
				console.log(WorkerThreads.threadId + " waiting for proxy...");
				await new Promise(r => setTimeout(r, 1000));
			}

			let ary = Array(150).fill(makeViewer());
			await Promise.all(ary).catch((err) => {
				WorkerThreads.parentPort.postMessage({
					type: "error",
					error: serializeError(err)
				});
			});

			await new Promise(p => setTimeout(p, 1000));
		}
	}
})();

process.on("uncaughtException", (err) => {
	console.error(err);
});
