import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    const esStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (esStandalone) {
      setInstalada(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalada(true);
      setPromptEvent(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (instalada) return null;

  const instalar = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setPromptEvent(null);
      }
    } else {
      setMostrarAyuda(true);
    }
  };

  return (
    <div className="install-pwa">
      {promptEvent ? (
        <button type="button" className="install-pwa-btn" onClick={instalar}>
          📲 Instalar app en el celular
        </button>
      ) : (
        <button type="button" className="install-pwa-link" onClick={() => setMostrarAyuda(!mostrarAyuda)}>
          📲 ¿Cómo instalar la app?
        </button>
      )}

      {mostrarAyuda && !promptEvent && (
        <div className="install-pwa-ayuda">
          <p><strong>En Android (Chrome):</strong></p>
          <ol>
            <li>Toca el menú ⋮ arriba a la derecha</li>
            <li>Elige <strong>“Instalar aplicación”</strong> o <strong>“Agregar a pantalla de inicio”</strong></li>
          </ol>
          <p className="meta">Si no aparece, visita la página unos segundos y vuelve a intentar.</p>
        </div>
      )}
    </div>
  );
}
