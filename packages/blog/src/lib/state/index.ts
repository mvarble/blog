import { theme as ui } from '@mvarble/mesearch-ui';

// The theme the page is showing, for components that draw their own colours
// (a WebGL scene, say). The choice itself is the rail's toggle.
export const theme = {
    get current(): 'light' | 'dark' {
        return ui.resolved;
    },
};
