import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { randomBytes, sign } from "crypto";

const confirmTx = async (signature: string) => {
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

    // Wait 100ms before next check
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Transaction confirmation timeout after ${
      timeoutMs / 1000
    } seconds: ${signature}`
  );
};

describe("escrow", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();
  const connection = provider.connection;

  const program = anchor.workspace.Escrow as Program<Escrow>;

  const tokenProgram = TOKEN_2022_PROGRAM_ID;

  const seed = new BN(randomBytes(8));

  const [maker, taker, mintA, mintB] = Array.from({ length: 4 }, () =>
    Keypair.generate()
  );

  const [makerAtaA, makerAtaB, takerAtaA, takerAtaB] = [maker, taker]
    .map((a) =>
      [mintA, mintB].map((m) =>
        getAssociatedTokenAddressSync(
          m.publicKey,
          a.publicKey,
          false,
          tokenProgram
        )
      )
    )
    .flat();

  const escrow = PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      maker.publicKey.toBuffer(),
      seed.toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  )[0];

  const vault = getAssociatedTokenAddressSync(
    mintA.publicKey,
    escrow,
    true,
    tokenProgram
  );

  // Accounts
  const accounts = {
    maker: maker.publicKey,
    taker: taker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    tokenProgram,
  };
  console.log("Accounts :" , accounts);

  it("Airdrop and create mints", async () => {
    let lamports = await getMinimumBalanceForRentExemptMint(connection);
    let tx = new Transaction();
    tx.instructions = [
      ...[maker, taker].map((account) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: account.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      ),
      ...[mintA, mintB].map((mint) =>
        SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports,
          space: MINT_SIZE,
          programId: tokenProgram,
        })
      ),
      ...[
        { mint: mintA.publicKey, authority: maker.publicKey, ata: makerAtaA },
        { mint: mintB.publicKey, authority: taker.publicKey, ata: takerAtaB },
      ].flatMap((x) => [
        createInitializeMint2Instruction(
          x.mint,
          6,
          x.authority,
          null,
          tokenProgram
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          x.ata,
          x.authority,
          x.mint,
          tokenProgram
        ),
        createMintToInstruction(
          x.mint,
          x.ata,
          x.authority,
          1e9,
          undefined,
          tokenProgram
        ),
      ]),
    ];

    await provider
      .sendAndConfirm(tx, [mintA, mintB, maker, taker])
      .then(async (signature) => {
        console.log(
          `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
        );
      });
  });

  it("Make", async () => {
    const balance = await connection.getBalance(maker.publicKey);
    console.log("Maker balance:", balance/LAMPORTS_PER_SOL); 
    await program.methods
      .make(seed, new BN(1e6), new BN(1e6))
      .accountsPartial({
        maker:maker.publicKey,
        mintA:mintA.publicKey,
        mintB:mintB.publicKey,
        makerAtaA,
        escrow,
        vault,
        tokenProgram,
      })
      .signers([maker])
      .rpc()
      .then(confirmTx)
      .then(async (signature) => {
        console.log(
          `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
        );
      });
  });

  // xit("Refund", async () => {
  //   await program.methods
  //     .refund()
  //     .accounts({ ...accounts })
  //     .signers([maker])
  //     .rpc()
  //     .then(confirmTx)
  //     .then(async(signature) => {
  //    console.log(`Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`)
  //  });
  // });

  it("Take", async () => {
    try {
      await program.methods
        .take()
        .accounts({ ...accounts })
        .signers([taker])
        .rpc()
        .then(confirmTx)
        .then(async (signature) => {
          console.log(
            `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
          );
        });
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});