// utils/toast.js

export const showToast = ({
  icon = "success",
  title = "",
  position = "top-end", // currently defaults to top-right
  timer = 3500,
}) => {
  // 1. Create or find the global toast container
  let container = document.getElementById("localawaaz-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "localawaaz-toast-container";
    // Mobile: Full width at the top. Desktop: Fixed to top right.
    container.className =
      "fixed z-[9999] pointer-events-none flex flex-col gap-3 p-4 top-0 right-0 left-0 sm:left-auto sm:top-4 sm:right-4 w-full sm:w-auto items-center sm:items-end";
    document.body.appendChild(container);
  }

  // 2. Create the individual toast element
  const toast = document.createElement("div");

  // App Theme Matching: Glass card, blurred background, border
  toast.className =
    "pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl px-4 py-3.5 shadow-2xl transition-all duration-300 translate-x-full sm:translate-x-full -translate-y-5 sm:translate-y-0 opacity-0";

  // 3. Define raw SVG icons so we don't need React DOM rendering here
  const icons = {
    success: `<svg class="h-6 w-6 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    error: `<svg class="h-6 w-6 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    warning: `<svg class="h-6 w-6 shrink-0 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
    info: `<svg class="h-6 w-6 shrink-0 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  };

  const progressColor =
    icon === "error"
      ? "bg-red-500"
      : icon === "warning"
        ? "bg-yellow-500"
        : icon === "success"
          ? "bg-green-500"
          : "bg-cyan-500";

  // 4. Inject HTML structure
  toast.innerHTML = `
    ${icons[icon] || icons.info}
    <div class="flex-1 text-sm font-medium text-foreground pr-2">${title}</div>
    <button class="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Close">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
    <div class="absolute bottom-0 left-0 h-1 ${progressColor} transition-all duration-100 ease-linear" style="width: 100%;"></div>
  `;

  container.appendChild(toast);

  // 5. Trigger CSS animation to slide in
  requestAnimationFrame(() => {
    toast.classList.remove("translate-x-full", "-translate-y-5", "opacity-0");
    toast.classList.add("translate-x-0", "translate-y-0", "opacity-100");
  });

  // 6. Handle Progress Bar & Timers
  const progressBar = toast.querySelector(".absolute.bottom-0");
  const closeBtn = toast.querySelector("button");

  let startTime = Date.now();
  let remaining = timer;
  let animationId;
  let isPaused = false;
  let timeoutId;

  const removeToast = () => {
    toast.classList.remove("translate-x-0", "translate-y-0", "opacity-100");
    toast.classList.add("opacity-0", "scale-95"); // Clean fade-out
    setTimeout(() => {
      if (container.contains(toast)) container.removeChild(toast);
      if (container.childNodes.length === 0) container.remove();
    }, 300); // Matches the CSS duration-300
  };

  const animateProgress = () => {
    if (isPaused) return;
    const elapsed = Date.now() - startTime;
    const progress = Math.max(0, 100 - (elapsed / timer) * 100);
    progressBar.style.width = `${progress}%`;

    if (progress > 0) {
      animationId = requestAnimationFrame(animateProgress);
    }
  };

  // Start animations
  animationId = requestAnimationFrame(animateProgress);
  timeoutId = setTimeout(removeToast, timer);

  // 7. Event Listeners (Pause on hover, manual close)
  toast.addEventListener("mouseenter", () => {
    isPaused = true;
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);
    remaining -= Date.now() - startTime;
  });

  toast.addEventListener("mouseleave", () => {
    isPaused = false;
    startTime = Date.now();
    timeoutId = setTimeout(removeToast, remaining);
    animationId = requestAnimationFrame(animateProgress);
  });

  closeBtn.addEventListener("click", () => {
    clearTimeout(timeoutId);
    cancelAnimationFrame(animationId);
    removeToast();
  });
};