import { SocksProxyAgent } from "socks-proxy-agent";

const proxy = "socks://127.0.0.1:7890";

export const agent = new SocksProxyAgent(proxy);
