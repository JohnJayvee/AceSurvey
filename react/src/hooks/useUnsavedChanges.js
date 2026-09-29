import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

export default function useUnsavedChanges(dirty) {
    const bypass = useRef(false);
    useEffect(() => { bypass.current = false; }, [dirty]);
    useBlocker(useCallback(({ currentLocation, nextLocation }) => {
        if (!dirty || bypass.current || currentLocation.key === nextLocation.key) return false;
        return !window.confirm('You have unsaved changes. Leave this page and discard them?');
    }, [dirty]));
    useEffect(() => {
        const warn = event => {
            if (!dirty || bypass.current) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    return useCallback(() => { bypass.current = true; }, []);
}
