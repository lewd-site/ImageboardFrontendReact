const ICON_WIDTH = 64;
const ICON_HEIGHT = 64;

let icon: HTMLLinkElement | null = null;
let context: CanvasRenderingContext2D | null = null;
let image: HTMLImageElement | null = null;

export function initFavicon() {
  const originalIcon = document.head.querySelector('link[rel="icon"]');
  if (originalIcon === null) {
    return Promise.reject();
  }

  icon = originalIcon.cloneNode(true) as HTMLLinkElement;
  icon.href = '';

  document.head.querySelectorAll('link[rel="icon"]').forEach((element) => element.remove());
  document.head.insertAdjacentElement('beforeend', icon);

  const canvas = document.createElement('canvas');
  canvas.width = ICON_WIDTH;
  canvas.height = ICON_HEIGHT;
  context = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = '/favicon-32x32.png';
    img.onerror = reject;
    img.onload = () => {
      image = img;
      resolve(img);
    };
  });
}

export function updateFavicon(unreadPostsCount: number) {
  if (icon === null || context === null) {
    return;
  }

  context.clearRect(0, 0, ICON_WIDTH, ICON_HEIGHT);

  if (image !== null) {
    context.drawImage(image, 0, 0, ICON_WIDTH, ICON_HEIGHT);
  }

  if (unreadPostsCount > 0) {
    context.fillStyle = '#ff1133';
    context.beginPath();
    context.arc((ICON_WIDTH * 3) / 4, (ICON_HEIGHT * 3) / 4, ICON_WIDTH / 4, 0, 2 * Math.PI);
    context.fill();
  }

  icon.href = context.canvas.toDataURL('image/png');
}

const originalTitle = document.title;

export function updateTitle(unreadPostsCount: number) {
  document.title = unreadPostsCount ? `[${unreadPostsCount}] ${originalTitle}` : originalTitle;
}
