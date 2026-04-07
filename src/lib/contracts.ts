import { useInterwovenKit } from "@initia/interwovenkit-react";
import { StdFee } from "@cosmjs/stargate";

export const useBattleQContracts = () => {
    const { requestTxSync, address } = useInterwovenKit();

    // Simple "session" starter: user stakes an amount into the BattleQ escrow module
    // and we treat that as the start of a solo stakes session.
    const startSoloSession = async (amount: string) => {
        if (!address) return;

        // Placeholder for Initia move message
        const message = {
            typeUrl: "/initia.move.v1.MsgExecute",
            value: {
                sender: address,
                moduleAddress: "0x1", // Example BattleQ Escrow Module
                moduleName: "escrow",
                functionName: "stake",
                typeArgs: [],
                args: [Buffer.from(amount).toString("hex")],
            },
        };

        const fee: StdFee = {
            amount: [{ denom: "uinit", amount: "1000" }],
            gas: "200000",
        };

        try {
            const txHash = await requestTxSync({
                messages: [message],
                gas: 200000,
            });
            console.log("BattleQ solo session started, staking TX Hash:", txHash);
            return txHash;
        } catch (error) {
            console.error("Solo session start failed:", error);
            throw error;
        }
    };

    const claimRewards = async () => {
        if (!address) return;

        const message = {
            typeUrl: "/initia.move.v1.MsgExecute",
            value: {
                sender: address,
                moduleAddress: "0x1",
                moduleName: "escrow",
                functionName: "claim",
                typeArgs: [],
                args: [],
            },
        };

        try {
            const txHash = await requestTxSync({
                messages: [message],
                gas: 200000,
            });
            console.log("Claim TX Hash:", txHash);
            return txHash;
        } catch (error) {
            console.error("Claim failed:", error);
            throw error;
        }
    };

    return {
        startSoloSession,
        claimRewards,
    };
};
