/* custom.js */

const CARD_IFRAME_MAX_CONCURRENT_LOADS = 3;
const CARD_IFRAME_MAX_LOADED = 6;
const CARD_IFRAME_PRELOAD_MARGIN = 300;
const CARD_IFRAME_ROOT_MARGIN = "300px 0px";
const CARD_IFRAME_UNLOAD_ROOT_MARGIN = "1200px 0px";
const CARD_IFRAME_LOAD_TIMEOUT_MS = 15000;

function initCardIframeQueue() {
	const cardIframes = Array.from(document.querySelectorAll("iframe[data-card-iframe-src]"));

	if (!cardIframes.length) {
		return;
	}

	const queue = [];
	const loaded = new Set();
	let activeLoads = 0;
	let nextLoadId = 1;

	const removeFromQueue = (iframe) => {
		const index = queue.indexOf(iframe);
		if (index >= 0) {
			queue.splice(index, 1);
		}
	};

	// Roughly mirrors the load observer's rootMargin so eviction never
	// touches a preview the user is currently about to see.
	const isNearViewport = (iframe) => {
		const rect = iframe.getBoundingClientRect();
		return rect.bottom >= -CARD_IFRAME_PRELOAD_MARGIN && rect.top <= window.innerHeight + CARD_IFRAME_PRELOAD_MARGIN;
	};

	const unloadIframe = (iframe) => {
		if (!iframe?.isConnected) {
			return;
		}

		const state = iframe.dataset.cardIframeState;
		if (state === "loading") {
			// Invalidate the in-flight load so its stale finishLoad is ignored,
			// and tear the heavy viewer down even while it is still booting.
			iframe.dataset.cardIframeLoadId = String((Number.parseInt(iframe.dataset.cardIframeLoadId, 10) || 0) + 1);
			activeLoads = Math.max(0, activeLoads - 1);
		} else if (state === "queued") {
			removeFromQueue(iframe);
		}

		loaded.delete(iframe);

		iframe.dataset.cardIframeState = "";
		iframe.removeAttribute("src");
		pumpQueue();
	};

	// Hard bound on the number of simultaneously running volumetric viewers.
	// Only evicts previews that are already outside the viewport.
	const evictIfNeeded = () => {
		if (loaded.size <= CARD_IFRAME_MAX_LOADED) {
			return;
		}

		for (const iframe of loaded) {
			if (iframe.dataset.cardIframeState !== "done" || isNearViewport(iframe)) {
				continue;
			}
			unloadIframe(iframe);
			if (loaded.size <= CARD_IFRAME_MAX_LOADED) {
				break;
			}
		}
	};

	const enqueue = (iframe) => {
		if (!iframe || iframe.dataset.cardIframeState) {
			return;
		}

		iframe.dataset.cardIframeState = "queued";
		queue.push(iframe);
		pumpQueue();
	};

	const pumpQueue = () => {
		while (activeLoads < CARD_IFRAME_MAX_CONCURRENT_LOADS && queue.length > 0) {
			const iframe = queue.shift();

			if (!iframe?.isConnected || iframe.dataset.cardIframeState !== "queued") {
				continue;
			}

			const src = iframe.getAttribute("data-card-iframe-src");
			if (!src) {
				iframe.dataset.cardIframeState = "done";
				continue;
			}

			const loadId = nextLoadId++;
			iframe.dataset.cardIframeLoadId = String(loadId);
			iframe.dataset.cardIframeState = "loading";
			activeLoads += 1;

			let finished = false;
			let loadTimeoutId = null;
			const finishLoad = () => {
				// Ignore completions from loads that were cancelled/restarted.
				if (finished || Number.parseInt(iframe.dataset.cardIframeLoadId, 10) !== loadId) {
					return;
				}
				finished = true;

				if (loadTimeoutId !== null) {
					window.clearTimeout(loadTimeoutId);
				}

				if (iframe.dataset.cardIframeState === "loading") {
					iframe.dataset.cardIframeState = "done";
					loaded.add(iframe);
				}
				activeLoads = Math.max(0, activeLoads - 1);
				evictIfNeeded();
				pumpQueue();
			};

			iframe.addEventListener("load", finishLoad, { once: true });
			iframe.addEventListener("error", finishLoad, { once: true });
			loadTimeoutId = window.setTimeout(finishLoad, CARD_IFRAME_LOAD_TIMEOUT_MS);
			iframe.src = src;
		}
	};

	if ("IntersectionObserver" in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) {
						continue;
					}

					enqueue(entry.target);
				}
			},
			{
				rootMargin: CARD_IFRAME_ROOT_MARGIN,
			},
		);

		for (const iframe of cardIframes) {
			observer.observe(iframe);
		}

		const unloadObserver = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						continue;
					}

					unloadIframe(entry.target);
				}
			},
			{
				rootMargin: CARD_IFRAME_UNLOAD_ROOT_MARGIN,
			},
		);

		for (const iframe of cardIframes) {
			unloadObserver.observe(iframe);
		}
		return;
	}

	for (const iframe of cardIframes) {
		enqueue(iframe);
	}
}

initCardIframeQueue();