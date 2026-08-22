import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Antes no existía ningún Error Boundary en la app: si un componente
 * lanzaba una excepción durante el render (por ejemplo, una respuesta
 * inesperada de la IA con un campo faltante), React desmontaba TODO el
 * árbol y la pantalla quedaba completamente en blanco, sin ningún mensaje.
 * Este componente atrapa esos errores y muestra una pantalla de
 * recuperación en vez de dejar la app "en blanco".
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Error desconocido' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error no controlado capturado por ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-7 text-center space-y-4">
            <div className="inline-flex p-3 rounded-2xl bg-rose-100 text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-black">Ocurrió un error inesperado</h1>
            <p className="text-xs text-slate-600">
              La aplicación encontró un problema al mostrar esta sección. Tu último borrador
              guardado sigue disponible.
            </p>
            {this.state.errorMessage && (
              <p className="text-[11px] font-mono bg-slate-100 rounded-lg p-2 text-slate-500 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl transition"
              >
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
