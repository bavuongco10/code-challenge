export const FAKE_PROVIDER_NAME = "Mock Pixel Wallet";
export const FAKE_ACCOUNT =
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // 11155111
export const MAINNET_CHAIN_ID_HEX = "0x1"; // 1

export function injectFakeProviderScript(options?: {
  initialChainId?: string;
  rejectSwitchChain?: boolean;
}) {
  const initialChain = options?.initialChainId ?? SEPOLIA_CHAIN_ID_HEX;
  const rejectSwitch = options?.rejectSwitchChain ?? false;

  return `
    (() => {
      let currentChainId = "${initialChain}";
      let rejectSwitch = ${rejectSwitch};
      const listeners = new Map();

      const provider = {
        isMetaMask: true,
        isMockPixel: true,
        request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
            return ['${FAKE_ACCOUNT}'];
          }
          if (method === 'eth_chainId') {
            return currentChainId;
          }
          if (method === 'wallet_switchEthereumChain') {
            if (rejectSwitch || window.__rejectSwitchChain) {
              const err = new Error('User rejected the request.');
              err.code = 4001;
              throw err;
            }
            const newChain = params[0].chainId;
            currentChainId = newChain;
            const handlers = listeners.get('chainChanged') || [];
            handlers.forEach(h => h(currentChainId));
            return null;
          }
          if (method === 'eth_sendTransaction') {
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          if (method === 'personal_sign' || method === 'eth_signTypedData_v4') {
            return '0xabcdef';
          }
          return null;
        },
        on: (event, handler) => {
          if (!listeners.has(event)) listeners.set(event, []);
          listeners.get(event).push(handler);
        },
        removeListener: (event, handler) => {
          const arr = listeners.get(event) || [];
          listeners.set(event, arr.filter(h => h !== handler));
        },
        emit: (event, ...args) => {
          const arr = listeners.get(event) || [];
          arr.forEach(h => h(...args));
        }
      };

      window.ethereum = provider;
      window.__fakeProvider = provider;
      window.__setRejectSwitch = (val) => { rejectSwitch = val; };

      const info = {
        uuid: '35067094-1188-4a9d-b891-888888888888',
        name: '${FAKE_PROVIDER_NAME}',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>',
        rdns: 'io.mock.pixel'
      };

      function announce() {
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', {
            detail: Object.freeze({ info, provider })
          })
        );
      }

      window.addEventListener('eip6963:requestProvider', announce);
      announce();
    })();
  `;
}
