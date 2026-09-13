export function getElement(selector, parent = document) {
  const element = parent.querySelector(selector);

  if (!element) {
    throw new Error(`Élément introuvable : ${selector}`);
  }

  return element;
}

export function getElements(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

export function delegateEvent(parent, eventName, selector, handler) {
  parent.addEventListener(eventName, (event) => {
    const target = event.target.closest(selector);

    if (!target || !parent.contains(target)) {
      return;
    }

    handler(event, target);
  });
}

export function safelyOpenDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
  }
}

export function safelyCloseDialog(dialog) {
  if (dialog.open) {
    dialog.close();
  }
}