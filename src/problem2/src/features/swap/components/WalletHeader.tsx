import { useAtomValue, useSetAtom } from "jotai";

import { connectAtom, connectedAtom } from "../walletAtoms.ts";
import { AccountMenu } from "./AccountMenu.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
import { WalletModeSwitch } from "./WalletModeSwitch.tsx";

export function WalletHeader() {
  const connected = useAtomValue(connectedAtom);
  const connect = useSetAtom(connectAtom);
  return (
    // wraps below 480px: parent's logo + account on row 1, mode switch on row 2
    <div className="contents">
      <div className="order-3 w-full min-[480px]:order-none min-[480px]:w-auto">
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
