import PropTypes from 'prop-types';
import { Component } from 'react';

export function RecoveryPage() {
    return <main className="min-h-screen flex flex-col items-center justify-center gap-5 p-8 text-center" role="alert">
        <h1 className="text-3xl font-bold">We couldn’t open this page.</h1>
        <p>Try reloading. If the problem continues, return to the survey hub.</p>
        <button type="button" className="ace-button" onClick={() => window.location.reload()}>Reload page</button>
        <a href="/survey-selection" className="ace-button ace-button-secondary">Go to survey hub</a>
    </main>;
}

export default class AppErrorBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error, info) { console.error('Unable to render AceSurvey', error, info); }
    render() { return this.state.failed ? <RecoveryPage /> : this.props.children; }
}
AppErrorBoundary.propTypes = {
   children: PropTypes.node,
};

