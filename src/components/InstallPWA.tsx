import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function esDispositivoApple(): boolean {
  const ua = navigator.userAgent;
  const esIOSClasico = /iPad|iPhone|iPod/.test(ua);
  const esIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return esIOSClasico || esIPadOS;
}

export function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [esApple, setEsApple] = useState(false);

  useEffect(() => {
    const apple = esDispositivoApple();
    setEsApple(apple);

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

  const tituloBoton = esApple
    ? '📲 Instalar en iPad / iPhone'
    : promptEvent
      ? '📲 Instalar app'
      : '📲 ¿Cómo instalar la app?';

  return (
    <div className="install-pwa">
      {promptEvent && !esApple ? (
        <button type="button" className="install-pwa-btn" onClick={instalar}>
          {tituloBoton}
        </button>
      ) : (
        <button
          type="button"
          className={esApple ? 'install-pwa-btn' : 'install-pwa-link'}
          onClick={() => setMostrarAyuda(!mostrarAyuda)}
        >
          {tituloBoton}
        </button>
      )}

      {mostrarAyuda && (
        <div className="install-pwa-ayuda">
          {esApple ? (
            <>
              <p><strong>En iPad o iPhone (Safari):</strong></p>
              <ol>
                <li>Abre esta página en <strong>Safari</strong> (no en Chrome ni en otra app)</li>
                <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha ↑)</li>
                <li>Desplázate y elige <strong>“Agregar a pantalla de inicio”</strong></li>
                <li>En iPad también puede decir <strong>“Agregar al Dock”</strong></li>
                <li>Toca <strong>Agregar</strong></li>
              </ol>
              <p className="meta">La app quedará como un ícono en tu pantalla de inicio o Dock.</p>
            </>
          ) : (
            <>
              <p><strong>En Android (Chrome):</strong></p>
              <ol>
                <li>Toca el menú ⋮ arriba a la derecha</li>
                <li>Elige <strong>“Instalar aplicación”</strong> o <strong>“Agregar a pantalla de inicio”</strong></li>
              </ol>
              <p className="meta">Si no aparece, visita la página unos segundos y vuelve a intentar.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
