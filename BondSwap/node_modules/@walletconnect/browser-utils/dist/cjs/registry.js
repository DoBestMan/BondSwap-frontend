"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMobileRegistry = exports.formatMobileRegistryEntry = exports.getAppLogoUrl = exports.getDappRegistryUrl = exports.getWalletRegistryUrl = void 0;
const API_URL = "https://registry.walletconnect.org";
function getWalletRegistryUrl() {
    return API_URL + "/data/wallets.json";
}
exports.getWalletRegistryUrl = getWalletRegistryUrl;
function getDappRegistryUrl() {
    return API_URL + "/data/dapps.json";
}
exports.getDappRegistryUrl = getDappRegistryUrl;
function getAppLogoUrl(id) {
    return API_URL + "/logo/sm/" + id + ".jpeg";
}
exports.getAppLogoUrl = getAppLogoUrl;
function formatMobileRegistryEntry(entry) {
    return {
        name: entry.name || "",
        shortName: entry.metadata.shortName || "",
        color: entry.metadata.colors.primary || "",
        logo: entry.id ? getAppLogoUrl(entry.id) : "",
        universalLink: entry.mobile.universal || "",
        deepLink: entry.mobile.native || "",
    };
}
exports.formatMobileRegistryEntry = formatMobileRegistryEntry;
function formatMobileRegistry(registry) {
    return Object.values(registry)
        .filter(entry => !!entry.mobile.universal || !!entry.mobile.native)
        .map(formatMobileRegistryEntry);
}
exports.formatMobileRegistry = formatMobileRegistry;
//# sourceMappingURL=registry.js.map