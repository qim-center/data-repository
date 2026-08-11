import justifiedLayout from "./justified-layout.js";
import * as params from "@params";

const gallery = document.getElementById("gallery");

if (gallery) {
  let layoutKey = "";
  const items = Array.from(gallery.querySelectorAll(".gallery-item"));
  const pagination = document.getElementById("gallery-pagination");

  const getPositiveIntegerParam = (searchParams, names, fallback) => {
    for (const name of names) {
      const value = Number.parseInt(searchParams.get(name), 10);
      if (Number.isInteger(value) && value > 0) return value;
    }

    return fallback;
  };

  const getPaginationState = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const perPage = Math.min(
      getPositiveIntegerParam(searchParams, ["perPage", "maxItems", "limit"], Math.max(items.length, 1)),
      Math.max(items.length, 1),
    );
    const totalPages = Math.max(Math.ceil(items.length / perPage), 1);
    let page = getPositiveIntegerParam(searchParams, ["page"], 1);

    if (window.location.hash.length > 1) {
      const target = window.location.hash.substring(1);
      const targetIndex = items.findIndex((item) => item.dataset["pswpTarget"] === target);
      if (targetIndex >= 0) {
        page = Math.floor(targetIndex / perPage) + 1;
      }
    }

    return {
      page: Math.min(page, totalPages),
      perPage,
      totalPages,
    };
  };

  const updateUrl = (page) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", page);
    url.hash = "";
    history.replaceState("", document.title, url);
  };

  let paginationState = getPaginationState();

  const applyPagination = () => {
    paginationState = getPaginationState();
    const firstVisibleIndex = (paginationState.page - 1) * paginationState.perPage;
    const lastVisibleIndex = firstVisibleIndex + paginationState.perPage;

    items.forEach((item, index) => {
      const isVisible = index >= firstVisibleIndex && index < lastVisibleIndex;
      item.classList.toggle("gallery-item--hidden", !isVisible);
      item.toggleAttribute("hidden", !isVisible);
      item.setAttribute("aria-hidden", String(!isVisible));
      item.tabIndex = isVisible ? 0 : -1;
    });
  };

  const getVisibleItems = () => items.filter((item) => !item.hidden);

  const renderPagination = () => {
    if (!pagination) return;

    pagination.replaceChildren();
    pagination.hidden = paginationState.totalPages <= 1;
    if (pagination.hidden) return;

    const createButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.disabled = options.disabled || false;
      button.className = options.current ? "gallery-pagination__button is-current" : "gallery-pagination__button";
      if (options.current) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        updateUrl(page);
        applyPagination();
        renderPagination();
        updateGallery(true);
        gallery.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return button;
    };

    pagination.append(
      createButton("Previous", Math.max(paginationState.page - 1, 1), { disabled: paginationState.page === 1 }),
    );

    for (let page = 1; page <= paginationState.totalPages; page += 1) {
      pagination.append(createButton(String(page), page, { current: page === paginationState.page }));
    }

    pagination.append(
      createButton("Next", Math.min(paginationState.page + 1, paginationState.totalPages), {
        disabled: paginationState.page === paginationState.totalPages,
      }),
    );
  };

  items.forEach((item) => {
    const img = item.querySelector("img");
    img.style.width = "100%";
    img.style.height = "auto";
  });

  function updateGallery(force = false) {
    const containerWidth = gallery.getBoundingClientRect().width;
    const visibleItems = getVisibleItems();
    const nextLayoutKey = `${containerWidth}:${paginationState.page}:${paginationState.perPage}`;

    if (!force && layoutKey === nextLayoutKey) return;
    layoutKey = nextLayoutKey;

    if (visibleItems.length === 0) {
      gallery.style.height = "0";
      gallery.style.visibility = "";
      return;
    }

    const aspectRatios = visibleItems.map((item) => {
      const img = item.querySelector("img");
      return parseFloat(img.getAttribute("width")) / parseFloat(img.getAttribute("height"));
    });

    const layout = justifiedLayout(aspectRatios, {
      rowWidth: containerWidth,
      spacing: Number.isInteger(params.boxSpacing) ? params.boxSpacing : 8,
      rowHeight: params.targetRowHeight || 288,
      heightTolerance: Number.isInteger(params.targetRowHeightTolerance) ? params.targetRowHeightTolerance : 0.25,
    });

    visibleItems.forEach((item, i) => {
      const { width, height, top, left } = layout.boxes[i];
      item.style.position = "absolute";
      item.style.width = width + "px";
      item.style.height = height + "px";
      item.style.top = top + "px";
      item.style.left = left + "px";
      item.style.overflow = "hidden";
    });

    gallery.style.position = "relative";
    gallery.style.height = layout.containerHeight + "px";
    gallery.style.visibility = "";
  }

  window.addEventListener("resize", updateGallery);
  window.addEventListener("orientationchange", updateGallery);

  applyPagination();
  renderPagination();

  // Call twice to adjust for scrollbars appearing after first call
  updateGallery();
}
