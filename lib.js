export const state = { products: [], orders: [], cart: new Map() };
export const $ = (selector) => document.querySelector(selector);
export const price = (value) => Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

export function setStatus(selector, message, error = false) {
  const node = $(selector);
  node.textContent = message;
  node.classList.toggle("error", error);
}

