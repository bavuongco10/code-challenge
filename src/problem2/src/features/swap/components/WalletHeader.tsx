import { useAtomValue, useSetAtom } from "jotai";

import { connectAtom, connectedAtom } from "../walletAtoms.ts";
import { AccountMenu } from "./AccountMenu.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
import { WalletModeSwitch } from "./WalletModeSwitch.tsx";

export function WalletHeader() {
  const connected = useAtomValue(connectedAtom);
  const connect = useSetAtom(connectAtom);
  return (
    // below 480px the mode switch wraps to its own row, sized to its content
    <div className="contents">
      <div className="order-3 min-[480px]:order-none">
        <WalletModeSwitch />
      </div>
      {connected ? (
        <AccountMenu />
      ) : (
        <button
          id="connect-wallet"
          type="button"
          onClick={() => connect()}
          className="pixel-btn pixel-focus flex items-center gap-2 bg-primary px-3 py-2 font-pixel text-[10px] text-on-fill"
        >
          <PixelIcon name="wallet" />
          Connect wallet
        </button>
      )}
    </div>
  );
}
