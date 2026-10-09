// Render the real server component against an isolated synthetic status file.
import { renderToStaticMarkup } from '../cms/node_modules/react-dom/server.node.js';
import { createElement } from '../cms/node_modules/react/index.js';
import { AppRouterContext } from '../cms/node_modules/next/dist/shared/lib/app-router-context.shared-runtime.js';
import PublicationStatus from '../cms/src/components/PublicationStatus.tsx';
process.stdout.write(renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: { refresh() {} } }, await PublicationStatus())));
