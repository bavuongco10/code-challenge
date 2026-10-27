import { useAtomValue, useSetAtom } from "jotai";
import { memo } from "react";

import { connectAtom, connectedAtom, walletModeAtom } from "../walletAtoms.ts";
import { AccountMenu } from "./AccountMenu.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
import { WalletModeSwitch } from "./WalletModeSwitch.tsx";

export const WalletHeader = memo(function WalletHeader() {
  const connected = useAtomValue(connectedAtom);
  const connect = useSetAtom(connectAtom);
  const mode = useAtomValue(walletModeAtom);

  return (
    // below 480px the mode switch wraps to its own row, sized to its content
    <div className="contents">
      <div className="order-3 flex items-center gap-2 min-[480px]:order-none">
        {mode === "sepolia" && (
          <span
            id="testnet-badge"
            className="border-2 border-ink bg-warn px-2 py-1 font-pixel text-[8px] uppercase text-on-accent"
          >
            TESTNET
          </span>
        )}
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
});
