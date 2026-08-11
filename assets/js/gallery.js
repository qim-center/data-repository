import justifiedLayout from "./justified-layout.js";
import * as params from "@params";

const DEFAULT_ITEMS_PER_PAGE = 6;
const itemsPerPage =
  Number.isInteger(params.itemsPerPage) && params.itemsPerPage > 0
    ? params.itemsPerPage
    : DEFAULT_ITEMS_PER_PAGE;

const clearChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const setElementHidden = (element, isHidden) => {
  if (isHidden) {
    element.setAttribute("hidden", "");
  } else {
    element.removeAttribute("hidden");
  }
};

const getPositiveIntegerParam = (searchParams, names, fallback) => {
  for (const name of names) {
    const value = Number.parseInt(searchParams.get(name), 10);
    if (Number.isInteger(value) && value > 0) return value;
  }

  return fallback;
};

const getPageUrl = (page) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  url.hash = "";
  return url;
};

const getSiblingPagination = (container) => {
  const nextElement = container.nextElementSibling;
  if (nextElement && nextElement.matches("[data-gallery-pagination]")) {
    return nextElement;
  }

  const pagination = document.createElement("nav");
  pagination.className = "gallery-pagination";
  pagination.setAttribute("data-gallery-pagination", "");
  pagination.setAttribute("aria-label", "Gallery pagination");
  container.parentNode.insertBefore(pagination, container.nextSibling);
  return pagination;
};

const renderPaginationButtons = ({ pagination, state, onPageChange }) => {
  clearChildren(pagination);
  setElementHidden(pagination, state.totalPages <= 1);
  if (state.totalPages <= 1) return;

  const createButton = (label, page, options = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.disabled = options.disabled || false;
    button.className = options.current ? "gallery-pagination__button is-current" : "gallery-pagination__button";
    if (options.current) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => onPageChange(page));
    return button;
  };

  pagination.appendChild(
    createButton("<", Math.max(state.page - 1, 1), { disabled: state.page === 1 }),
  );

  for (let page = 1; page <= state.totalPages; page += 1) {
    pagination.appendChild(createButton(String(page), page, { current: page === state.page }));
  }

  pagination.appendChild(
    createButton(">", Math.min(state.page + 1, state.totalPages), {
      disabled: state.page === state.totalPages,
    }),
  );
};

const gallery = document.getElementById("gallery");

if (gallery) {
  let layoutKey = "";
  const items = Array.from(gallery.querySelectorAll(".gallery-item"));
  const pagination = document.getElementById("gallery-pagination");

  const getPaginationState = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const itemCount = Math.max(items.length, 1);
    const perPage = Math.min(getPositiveIntegerParam(searchParams, ["perPage", "maxItems", "limit"], itemsPerPage), itemCount);
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

  let paginationState = getPaginationState();

  const applyPagination = () => {
    paginationState = getPaginationState();
    const firstVisibleIndex = (paginationState.page - 1) * paginationState.perPage;
    const lastVisibleIndex = firstVisibleIndex + paginationState.perPage;

    items.forEach((item, index) => {
      const isVisible = index >= firstVisibleIndex && index < lastVisibleIndex;
      item.classList.toggle("gallery-item--hidden", !isVisible);
      setElementHidden(item, !isVisible);
      item.setAttribute("aria-hidden", String(!isVisible));
      item.tabIndex = isVisible ? 0 : -1;
    });
  };

  const getVisibleItems = () => items.filter((item) => !item.hasAttribute("hidden"));

  const renderPagination = () => {
    if (!pagination) return;

    renderPaginationButtons({
      pagination,
      state: paginationState,
      onPageChange: (page) => {
        history.replaceState("", document.title, getPageUrl(page));
        applyPagination();
        renderPagination();
        updateGallery(true);
        gallery.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    });
  };

  items.forEach((item) => {
    const img = item.querySelector("img");
    if (!img) return;
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

document.querySelectorAll("section.galleries").forEach((cardGallery) => {
  const cards = Array.from(cardGallery.children).filter((element) => element.classList.contains("card"));
  if (cards.length === 0) return;

  const pagination = getSiblingPagination(cardGallery);

  const getPaginationState = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const perPage = Math.min(getPositiveIntegerParam(searchParams, ["perPage", "maxItems", "limit"], itemsPerPage), cards.length);
    const totalPages = Math.max(Math.ceil(cards.length / perPage), 1);
    const page = getPositiveIntegerParam(searchParams, ["page"], 1);

    return {
      page: Math.min(page, totalPages),
      perPage,
      totalPages,
    };
  };

  let paginationState = getPaginationState();

  const applyPagination = () => {
    paginationState = getPaginationState();
    const firstVisibleIndex = (paginationState.page - 1) * paginationState.perPage;
    const lastVisibleIndex = firstVisibleIndex + paginationState.perPage;

    cards.forEach((card, index) => {
      const isVisible = index >= firstVisibleIndex && index < lastVisibleIndex;
      setElementHidden(card, !isVisible);
      card.setAttribute("aria-hidden", String(!isVisible));
    });
  };

  const renderPagination = () => {
    renderPaginationButtons({
      pagination,
      state: paginationState,
      onPageChange: (page) => {
        history.replaceState("", document.title, getPageUrl(page));
        applyPagination();
        renderPagination();
        cardGallery.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    });
  };

  applyPagination();
  renderPagination();
});
