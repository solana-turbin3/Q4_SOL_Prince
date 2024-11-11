import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { AcumulativeLeaderboard } from "../target/types/acumulative_leaderboard";

describe("init", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.AcumulativeLeaderboard as Program<AcumulativeLeaderboard>;
  const [global] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("leaderboard")],
    program.programId,
  )
  it("Is initialized!", async () => {
    const tx = await program.methods
      .initialize()
      .accounts({ global })
      .rpc();

    console.log("Your transaction signature is: ", tx);
    console.log("test, test");
  });
});
