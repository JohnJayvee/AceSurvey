import { mergeConfig } from 'vite';
import config from './vite.config';

export default mergeConfig(config, {
   server: { host: '127.0.0.1', port: 4173, open: false },
});
