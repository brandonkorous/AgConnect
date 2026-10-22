import { installReactHook } from '@wizeworks/lens-react';
import { serverTraces } from './components/WizeLens';

// React reports every commit to a global hook that react-dom reads once, when
// it loads, and this file runs before hydration. Installing it here times each
// render per component, only when this page's server traces it.
if (serverTraces()) {
    installReactHook();
}
