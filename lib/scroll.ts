// Scroll a target to the middle of its pane, but only if it is off-screen.

export function scrollIfNeeded(el: HTMLElement, box: HTMLElement) {
  const vis = box.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.top >= vis.top && r.bottom <= vis.bottom) return;
  const delta = r.top + r.height / 2 - (vis.top + vis.height / 2);
  const max = Math.max(0, box.scrollHeight - box.clientHeight);
  box.scrollTo({
    top: Math.min(max, Math.max(0, box.scrollTop + delta)),
    behavior: "smooth",
  });
}
