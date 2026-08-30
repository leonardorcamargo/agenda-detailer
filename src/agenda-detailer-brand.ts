const ORIGINAL_LOGO_ASSET = '/agenda-detailer-logo.png';
const DASHBOARD_LOGO_SELECTOR = 'img[alt="Agenda Detailer — Gestão automotiva inteligente"]';

let originalLogoDataUrl: string | null = null;
let loadingLogo: Promise<string | null> | null = null;

const loadOriginalLogo = () => {
  if (originalLogoDataUrl) return Promise.resolve(originalLogoDataUrl);
  if (loadingLogo) return loadingLogo;

  loadingLogo = fetch(ORIGINAL_LOGO_ASSET)
    .then((response) => response.text())
    .then((base64) => {
      const normalized = base64.trim();
      if (!normalized) return null;
      originalLogoDataUrl = `data:image/png;base64,${normalized}`;
      return originalLogoDataUrl;
    })
    .catch(() => null);

  return loadingLogo;
};

const applyOriginalLogo = async () => {
  const image = document.querySelector<HTMLImageElement>(DASHBOARD_LOGO_SELECTOR);
  if (!image || image.dataset.originalAgendaDetailerLogo === 'true') return;

  const dataUrl = await loadOriginalLogo();
  if (!dataUrl) return;

  image.src = dataUrl;
  image.dataset.originalAgendaDetailerLogo = 'true';
  image.className = 'h-auto w-[240px] max-w-full object-contain opacity-95 sm:w-[285px]';
};

export const installAgendaDetailerBrand = () => {
  void applyOriginalLogo();

  const observer = new MutationObserver(() => {
    void applyOriginalLogo();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
};
