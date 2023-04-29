import { SocksProxyAgent } from 'socks-proxy-agent';

const proxy = 'socks://127.0.0.1:10808';

export const agent = new SocksProxyAgent(proxy);