# LEXA 29

A sealed edition of 29 unique works on Stacks. Each piece can be minted once. Mint price follows uniqueness, from 10 to 20 STX. After mint, the owner can list the work on the collection market. A sale pays the artist, the protocol, and the seller from the same contract.

The artwork is not stored in the contract. Each piece is an SVG, sealed in the frontend and opened only by the gallery. The contract records ownership, price, and listings.

Deployed on testnet as [`ST3XHHZ1CXVCNYXK3FQ1FDGJ9NK6YBJBJK3FVY5KQ.atelier-29`](https://explorer.hiro.so/txid/0xe934ec8c059494203b6f578253f6be20a7c7807321709ed80be8f6422cb92239?chain=testnet).

## Tokenomics

| | |
| --- | --- |
| Edition | 29 works, one mint each |
| Primary sale | 90% artist, 10% protocol treasury |
| Secondary sale | 5% artist royalty, 2.5% protocol fee, 92.5% seller |
| List price | At least 1 STX |
| Listing | The NFT sits in the contract until it sells or the seller cancels |

The creator can withdraw the treasury. The contract cannot remint a sold piece or seize one that is not listed.

## Layout

```
collection/
├── contracts/contracts/atelier-29.clar   # Clarity source
├── contracts/tests/atelier-29.test.ts    # simnet tests
├── contracts/settings/                   # deployer config per network
└── frontend/src/
    ├── app/                              # gallery, piece, market
    ├── components/collection/            # UI
    ├── collection/                       # catalog, sealed art, chain reads
    └── generated/                        # stacksdapp output — do not edit
```

Public calls: `mint`, `list-work`, `cancel-listing`, `buy`, `transfer`, `withdraw-treasury`, `set-base-uri`. Reads include `get-piece`, `get-listing`, `get-tokenomics`, `quote-mint`, and `quote-sale`.

## Run it

From this directory:

```bash
npm install
npm run setup-hooks
npm run check
npm run test
npm run dev
```

`npm run dev` is `stacksdapp dev`, which starts the Next.js app. For the deployed testnet contract:

```bash
stacksdapp dev --network testnet
```

The app is at http://localhost:3000. Connect a Stacks wallet on testnet to mint, list, or buy.

Regenerate TypeScript after a contract change, then test before deploying:

```bash
stacksdapp generate
stacksdapp check && stacksdapp test
stacksdapp deploy --network testnet --yes
```

Do not put a deployer seed in git. `contracts/settings/Testnet.toml` and `Mainnet.toml` are where the CLI reads it, and the pre-commit hook is what stops an accidental commit. Run `npm run setup-hooks` once per clone or that guard is not installed.

## Artwork

`frontend/src/collection/sealed.json` holds the encrypted SVGs. `ArtFrame` decrypts a single piece for the page that is showing it. The contract's token URI is a placeholder; wallets that only follow `get-token-uri` will not see these images.

## Feedback on Scaffold Stacks

We built this with [Scaffold Stacks](https://scaffoldstacks.mintlify.app/). It was helpful. The usual Stacks friction is wiring a Clarity contract to a frontend, keeping the two in sync, and getting a first deploy onto testnet without inventing the project layout yourself. Scaffold mostly takes that off the table. You write the contract, generate the hooks, test, and deploy, and the app already knows which contract it is talking to.

It does not remove the work of building the product. The gallery, the sealed art, and the market are still normal frontend work. What it removes is the setup around that: where files live, how a wallet call is shaped, and how you get from a passing test to a testnet address. That was the part that used to take the longest, and here it was the part that felt routine.

A few things still slow you down. Reading values back from the chain is a little clumsier than the call hooks suggest given it's nested nature. None of that blocked the build. We would use it again for the next Stacks app, mainly because the path from contract to a working testnet UI is short and you spend your time on the product instead of the plumbing.
