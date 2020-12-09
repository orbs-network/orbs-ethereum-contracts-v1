import { VirtualChainUrls, NodeServiceUrls, NodeVirtualChainUrls, Service } from '../systemState';

const PrismSuffix = '.prism.orbs.network/';
const SubscriptionUiPrefix = 'subscription.orbs.network/vc/';
export function generateVirtualChainUrls(vcId: string): VirtualChainUrls {
  return {
    Prism: `https://${vcId}${PrismSuffix}`,
    Subscription: `https://${SubscriptionUiPrefix}/${vcId}`,
  };
}

export const StatusSuffix = '/status';
const LogsSuffix = '/logs';

export function generateNodeVirtualChainUrls(ip: string, vcid: string): NodeVirtualChainUrls {
  return {
    Status: `http://${ip}/vchains/${vcid}${StatusSuffix}`,
    Management: `http://${ip}:7666/vchains/${vcid}/management`,
    Logs: `http://${ip}/vchains/${vcid}${LogsSuffix}`,
    Version: '',
  };
}

export function generateNodeServiceUrls(ip: string, service: Service): NodeServiceUrls {
  return {
    Status: `http://${ip}/services/${service.ServiceUrlName}${StatusSuffix}`,
    Logs: `http://${ip}/services/${service.ServiceUrlName}${LogsSuffix}`,
    Version: '',
  };
}

export function updateNodeServiceUrlsWithVersion(urls: NodeServiceUrls, repoUrl: string, version: string) {
  urls.Version = `${repoUrl}${version}`;
}

export function generateNodeManagmentUrl(ip: string) {
  return `http://${ip}:7666/node/management`;
}
