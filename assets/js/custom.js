/* custom.js */

const CARD_IFRAME_MAX_CONCURRENT_LOADS = 3;
const CARD_IFRAME_ROOT_MARGIN = "300px 0px";

function initCardIframeQueue() {
	const cardIframes = Array.from(document.querySelectorAll("iframe[data-card-iframe-src]"));

	if (!cardIframes.length) {
		return;
	}

	const queue = [];
	let activeLoads = 0;

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

			iframe.dataset.cardIframeState = "loading";
			activeLoads += 1;

			const finishLoad = () => {
				if (iframe.dataset.cardIframeState === "done") {
					return;
				}

				iframe.dataset.cardIframeState = "done";
				activeLoads = Math.max(0, activeLoads - 1);
				pumpQueue();
			};

			iframe.addEventListener("load", finishLoad, { once: true });
			iframe.addEventListener("error", finishLoad, { once: true });
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

					observer.unobserve(entry.target);
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
		return;
	}

	for (const iframe of cardIframes) {
		enqueue(iframe);
	}
}

initCardIframeQueue();
