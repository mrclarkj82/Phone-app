let restoreScrollIntoView = null;
let restoreFocus = null;
let revealStudentWorkUntil = 0;

function isStudentWorkPanel(element) {
  return element instanceof Element && element.id === "student-work-panel";
}

function shouldAllowStudentWorkReveal() {
  return performance.now() <= revealStudentWorkUntil;
}

export function startStudentWorkScrollGuard() {
  if (typeof document === "undefined" || restoreScrollIntoView) {
    return () => {};
  }

  const originalScrollIntoView = Element.prototype.scrollIntoView;
  const originalFocus = HTMLElement.prototype.focus;

  document.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest("[data-view-work]")) {
        revealStudentWorkUntil = performance.now() + 1000;
      }
    },
    true,
  );

  Element.prototype.scrollIntoView = function guardedScrollIntoView(...args) {
    if (isStudentWorkPanel(this) && !shouldAllowStudentWorkReveal()) {
      return undefined;
    }

    return originalScrollIntoView.apply(this, args);
  };

  HTMLElement.prototype.focus = function guardedFocus(...args) {
    if (isStudentWorkPanel(this) && !shouldAllowStudentWorkReveal()) {
      return undefined;
    }

    return originalFocus.apply(this, args);
  };

  restoreScrollIntoView = () => {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  };
  restoreFocus = () => {
    HTMLElement.prototype.focus = originalFocus;
  };

  return () => {
    restoreScrollIntoView?.();
    restoreFocus?.();
    restoreScrollIntoView = null;
    restoreFocus = null;
  };
}
