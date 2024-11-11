import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { AcumulativeLeaderboard } from "../target/types/acumulative_leaderboard";

describe("play", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.AcumulativeLeaderboard as Program<AcumulativeLeaderboard>;

  const payer = (program.provider as anchor.AnchorProvider).wallet;
  const [global] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("leaderboard")],
    program.programId,
  )
  const [user] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user"), global.toBuffer(), payer.publicKey.toBuffer()],
    program.programId,
  )

  it("Playing now!!", async () => {
    try {
    const tx = await program.methods
      .play()
      .accounts({ user, global })
      .rpc({
        skipPreflight:true
      })  ;

    console.log("Your transaction signature is: ", tx);
    } catch (e) {
      console.log(e);
    }
  });
});