import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorVault } from "../target/types/anchor_vault";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";

const confirmTx = async (signature: string) => {
  console.log("confirm transaction");
  const startTime = Date.now();
  const timeoutMs = 60000; // 1 minute timeout

  while (Date.now() - startTime < timeoutMs) {
    const response = await anchor
      .getProvider()
      .connection.getSignatureStatuses([signature]);
    const status = response.value[0];

    if (status && status.confirmationStatus === "confirmed") {
      return signature;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Transaction confirmation timeout after ${
      timeoutMs / 1000
    } seconds: ${signature}`
  );
};

describe("anchor_vault", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.D1AnchorVault as Program<AnchorVault>;
  console.log("id :", program.programId.toBase58());

  const user = Keypair.generate();
  console.log("user :", user.publicKey.toBase58());

  const [vault_state] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("state"), user.publicKey.toBytes()],
    program.programId
  );

  const [vault] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vault_state.toBytes()],
    program.programId
  );

  it("Airdrop sol", async () => {
    const airdropAmt = 100;
    const txhash = await provider.connection
      .requestAirdrop(user.publicKey, airdropAmt * LAMPORTS_PER_SOL)
      .then(confirmTx);
    console.log("tx sign :", txhash);
  });

  it("Initialize Account", async () => {
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          user: user.publicKey,
          vault_state: vault_state,
          vault: vault,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()
        .then(confirmTx);
      console.log("init txhash :", tx);
      console.log("vault id: ", vault.toBase58());
    } catch (e) {
      console.log("error while init :", e);
    }
  });

  it("deposit sol", async () => {
    try {
      const depositAmt = 10;
      const tx = await program.methods
        .deposit(new BN(depositAmt * LAMPORTS_PER_SOL))
        .accounts({
          user: user.publicKey,
          vault: vault,
          vault_state: vault_state,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()
        .then(confirmTx);
      console.log("Deposited Sol tx: ", tx);
    } catch (e) {
      console.log("error while deposit : ", e);
    }
  });

  it("Withdraw Sol", async () => {
    try {
      const withdrawAmt = 5;
      const tx = await program.methods
        .withdraw(new BN(withdrawAmt * LAMPORTS_PER_SOL))
        .accounts({
          user: user.publicKey,
          vault: vault,
          vault_state: vault_state,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()
        .then(confirmTx);
      console.log("withdraw sol : ", tx);
    } catch (e) {
      console.log("Error while withdraw : ", e);
    }
  });

  it("Close Account", async () => {
    try {
      const tx = await program.methods
        .close()
        .accounts({
          user: user.publicKey,
          vault: vault,
          vault_state: vault_state,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()
        .then(confirmTx);
      console.log("Closed account tx :", tx);
    } catch (e) {
      console.log("Error while closing vault :", e);
    }
  });
});
