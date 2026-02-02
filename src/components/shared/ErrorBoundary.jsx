import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    componentDidCatch(error, errorInfo) { console.error("Crash:", error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-red-50 text-red-900 text-center">
                    <AlertTriangle size={64} className="mb-4 text-red-600" />
                    <h1 className="text-2xl font-bold">Algo salió mal</h1>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-6 py-2 rounded">Recargar</button>
                </div>
            );
        }
        return this.props.children;
    }
}
