import 'url-search-params-polyfill';

import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill';
(global as any).EventSource = NativeEventSource || EventSourcePolyfill;
