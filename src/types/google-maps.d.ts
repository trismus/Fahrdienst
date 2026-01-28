declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
  }
}

export {};
