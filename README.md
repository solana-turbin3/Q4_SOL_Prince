# Q4_SOL_Prince

Welcome to my Solana Q4 Builder Cohort repository! This repository contains various projects and code snippets I have worked on while learning about Solana and its ecosystem. Each folder contains specific examples and implementations related to Solana development, including wallet management, token minting, and NFT creation.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Projects](#projects)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

In this repository, I document my learning journey through the Solana blockchain. I explore various functionalities, including how to create wallets, manage tokens, interact with smart contracts, and upload metadata for NFTs. The code is primarily written in TypeScript and leverages the Solana Web3.js library and Metaplex SDK.

## Prerequisites

Before running any code in this repository, ensure you have the following installed:

- Node.js (version 14.x or later)
- yarn
- A Solana wallet (you can use the Solana CLI to create one)
- Access to the Solana devnet (the default network used in the examples)
- create Turbin-3-wallet.josn and dev-wallet.json and paste your private key byte array

## Projects

### 0. Parereqs
- **Keypair Generation**: Generate a new Solana wallet and manage private keys.
- **Airdrop Tokens**: Request airdrops of SOL tokens to your wallet.
- **Transfer Tokens**: Transfer SOL tokens from one wallet to another.

### 1.1 Token Creatinon
- **Create Mint**: Create a new token Mint on the Solana blockchain.
- **Transfer Tokens**: Mint Token to  wallets using associated token accounts.

### 1.2 Token With MetaData
- **Create Mint**: Create a new tokens Mint with metadata on the Solana blockchain.
- **Transfer Tokens**: Transfer/Mint Token to wallets using associated token accounts.

### 1.2 NFT Creation
- **Create Images**: Upload images to decentralized storage (Irys) and create metadata for NFTs.
- **Create Metadata**: Create metadata for NFTs.
- **Mint NFTs**: Mint NFTs with specified metadata.

### 3. Additional Functionality
- Interact with smart contracts using the Anchor framework.
- Work with associated token accounts for better token management.

## Usage

To get started, clone this repository and install the necessary dependencies:

```bash
git clone https://github.com/solana-turbin3/Q4_Sol_Prince.git
cd Q4_Sol_Prince.git
touch dev-wallet.json
touch Turbin3-wallet.json
yarn install
