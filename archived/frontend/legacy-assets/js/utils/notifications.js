import { getElement } from "./dom.js";

let timeoutId;

export function showNotification(message) {
  const toast = getElement("#toast");
  window.clearTimeout(timeoutId);
  toast.textContent = message;
  toast.classList.add("is-visible");
  timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2800);
}
