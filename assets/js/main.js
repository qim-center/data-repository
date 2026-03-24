import "./menu.js";
import "./gallery.js";
import "./lazysizes.js";
import "./lightbox.js";
import "./custom.js";

const copyIcon = `
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<rect x="9" y="9" width="10" height="10" rx="2"></rect>
		<path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
	</svg>
`;

const checkIcon = `
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path d="M20 6 9 17l-5-5"></path>
	</svg>
`;

function initCodeCopyButtons() {
	if (!navigator.clipboard?.writeText) {
		return;
	}

	for (const block of document.querySelectorAll(".prose .highlight, .prose pre")) {
		if (block.matches("pre") && block.parentElement?.classList.contains("highlight")) {
			continue;
		}

		const pre = block.matches("pre") ? block : block.querySelector("pre");

		if (!pre || block.querySelector(":scope > .code-copy")) {
			continue;
		}

		const button = document.createElement("button");
		button.type = "button";
		button.className = "code-copy";
		button.title = "Copy code";
		button.setAttribute("aria-label", "Copy code");
		button.innerHTML = `${copyIcon}`;
		button.addEventListener("click", async () => {
			const code = pre.textContent.replace(/\n$/, "");
			await navigator.clipboard.writeText(code).catch(() => {});

			button.innerHTML = `${checkIcon}`;
			button.title = "Copied";
			button.setAttribute("aria-label", "Copied");

			window.setTimeout(() => {
				button.innerHTML = `${copyIcon}`;
				button.title = "Copy code";
				button.setAttribute("aria-label", "Copy code");
			}, 3000);
		});
		block.append(button);
	}
}

initCodeCopyButtons();
