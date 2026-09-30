;; LEXA 29 - sealed edition of 29 unique works.
;;
;; SIP-009 functions: get-last-token-id, get-token-uri, get-owner, transfer.
;; For mainnet wallet listing, add before deploy:
;;   (impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait)
;; Testnet ships without impl-trait. See sip-standards.md.
;;
;; Tokenomics
;; Primary mint (10-20 STX by uniqueness):
;;   90% creator, 10% protocol treasury held by this contract.
;; Secondary sales on this marketplace:
;;   5% creator royalty, 2.5% protocol fee, 92.5% seller.
;; Listing escrows the NFT in this contract until sale or cancel.
;; Supply is fixed: one mint per id, ids 1 through 29, no admin remint.

(define-non-fungible-token atelier-29 uint)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant CREATOR CONTRACT_OWNER)
(define-constant COLLECTION_SIZE u29)
(define-constant BPS_DENOM u10000)
(define-constant CREATOR_PRIMARY_BPS u9000)
(define-constant PROTOCOL_PRIMARY_BPS u1000)
(define-constant ROYALTY_BPS u500)
(define-constant MARKET_FEE_BPS u250)
(define-constant MIN_LIST_PRICE u1000000)

(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_INVALID_ID (err u102))
(define-constant ERR_ALREADY_MINTED (err u103))
(define-constant ERR_NOT_MINTED (err u104))
(define-constant ERR_BAD_PRICE (err u105))
(define-constant ERR_ALREADY_LISTED (err u106))
(define-constant ERR_NOT_LISTED (err u107))
(define-constant ERR_SELF_PURCHASE (err u108))
(define-constant ERR_LISTED (err u109))
(define-constant ERR_EMPTY_TREASURY (err u110))

(define-data-var last-token-id uint u0)
(define-data-var minted-count uint u0)
(define-data-var base-uri (string-ascii 256) "https://lexa29.collection/metadata/{id}")

(define-constant MINT_PRICES (list
  u20000000 u19000000 u18000000 u17000000 u17000000
  u16000000 u16000000 u15000000 u15000000 u15000000
  u14000000 u14000000 u14000000 u14000000 u13000000
  u13000000 u13000000 u13000000 u12000000 u12000000
  u12000000 u12000000 u11000000 u11000000 u11000000
  u11000000 u10000000 u10000000 u10000000
))

(define-constant UNIQUENESS (list
  u100 u96 u92 u86 u84
  u80 u78 u72 u70 u68
  u64 u62 u60 u58 u52
  u50 u48 u46 u42 u40
  u38 u36 u30 u28 u26
  u24 u18 u14 u10
))

(define-map listings uint { seller: principal, price: uint })

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-minted-count)
  (ok (var-get minted-count)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get base-uri))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? atelier-29 token-id)))

(define-read-only (get-creator)
  (ok CREATOR))

(define-read-only (get-treasury-balance)
  (ok (stx-get-balance current-contract)))

(define-read-only (get-tokenomics)
  (ok {
    collection-size: COLLECTION_SIZE,
    creator-primary-bps: CREATOR_PRIMARY_BPS,
    protocol-primary-bps: PROTOCOL_PRIMARY_BPS,
    royalty-bps: ROYALTY_BPS,
    market-fee-bps: MARKET_FEE_BPS,
    min-list-price: MIN_LIST_PRICE,
    bps: BPS_DENOM,
    minted: (var-get minted-count),
  }))

(define-read-only (get-mint-price (id uint))
  (begin
    (asserts! (and (>= id u1) (<= id COLLECTION_SIZE)) ERR_INVALID_ID)
    (ok (unwrap! (element-at? MINT_PRICES (- id u1)) ERR_INVALID_ID))))

(define-read-only (get-uniqueness (id uint))
  (begin
    (asserts! (and (>= id u1) (<= id COLLECTION_SIZE)) ERR_INVALID_ID)
    (ok (unwrap! (element-at? UNIQUENESS (- id u1)) ERR_INVALID_ID))))

(define-read-only (get-listing (id uint))
  (ok (map-get? listings id)))

(define-read-only (quote-mint (id uint))
  (let (
    (price (try! (get-mint-price id)))
    (protocol (/ (* price PROTOCOL_PRIMARY_BPS) BPS_DENOM))
  )
    (ok {
      price: price,
      protocol: protocol,
      creator: (- price protocol),
    })))

(define-read-only (quote-sale (price uint))
  (let (
    (royalty (/ (* price ROYALTY_BPS) BPS_DENOM))
    (fee (/ (* price MARKET_FEE_BPS) BPS_DENOM))
  )
    (ok {
      royalty: royalty,
      fee: fee,
      seller: (- price (+ royalty fee)),
    })))

(define-read-only (get-piece (id uint))
  (ok {
    price: (try! (get-mint-price id)),
    uniqueness: (try! (get-uniqueness id)),
    owner: (nft-get-owner? atelier-29 id),
    listing: (map-get? listings id),
  }))

(define-public (set-base-uri (value (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_OWNER_ONLY)
    (var-set base-uri value)
    (ok (print {
      notification: "token-metadata-update",
      payload: {
        token-class: "nft",
        contract-id: current-contract,
      }
    }))))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-none (map-get? listings token-id)) ERR_LISTED)
    (asserts! (or (is-eq tx-sender sender) (is-eq contract-caller sender)) ERR_NOT_TOKEN_OWNER)
    (nft-transfer? atelier-29 token-id sender recipient)))

(define-public (mint (id uint))
  (let (
    (price (try! (get-mint-price id)))
    (protocol (/ (* price PROTOCOL_PRIMARY_BPS) BPS_DENOM))
    (creator-share (- price protocol))
  )
    (asserts! (is-none (nft-get-owner? atelier-29 id)) ERR_ALREADY_MINTED)
    (try! (stx-transfer? creator-share tx-sender CREATOR))
    (try! (stx-transfer? protocol tx-sender current-contract))
    (try! (nft-mint? atelier-29 id tx-sender))
    (var-set minted-count (+ (var-get minted-count) u1))
    (var-set last-token-id (if (> id (var-get last-token-id)) id (var-get last-token-id)))
    (print { action: "mint", id: id, price: price, minter: tx-sender })
    (ok id)))

(define-public (list-work (id uint) (price uint))
  (let ((owner (unwrap! (nft-get-owner? atelier-29 id) ERR_NOT_MINTED)))
    (asserts! (is-eq tx-sender owner) ERR_NOT_TOKEN_OWNER)
    (asserts! (>= price MIN_LIST_PRICE) ERR_BAD_PRICE)
    (asserts! (is-none (map-get? listings id)) ERR_ALREADY_LISTED)
    (try! (nft-transfer? atelier-29 id tx-sender current-contract))
    (map-set listings id { seller: tx-sender, price: price })
    (print { action: "list", id: id, price: price, seller: tx-sender })
    (ok true)))

(define-public (cancel-listing (id uint))
  (let (
    (listing (unwrap! (map-get? listings id) ERR_NOT_LISTED))
    (seller (get seller listing))
  )
    (asserts! (is-eq tx-sender seller) ERR_NOT_TOKEN_OWNER)
    (try! (as-contract? ((with-nft current-contract "atelier-29" (list id)))
      (try! (nft-transfer? atelier-29 id tx-sender seller))))
    (map-delete listings id)
    (print { action: "cancel", id: id, seller: seller })
    (ok true)))

(define-public (buy (id uint))
  (let (
    (listing (unwrap! (map-get? listings id) ERR_NOT_LISTED))
    (price (get price listing))
    (seller (get seller listing))
    (buyer tx-sender)
    (royalty (/ (* price ROYALTY_BPS) BPS_DENOM))
    (fee (/ (* price MARKET_FEE_BPS) BPS_DENOM))
    (payout (- price (+ royalty fee)))
  )
    (asserts! (not (is-eq buyer seller)) ERR_SELF_PURCHASE)
    (try! (stx-transfer? royalty buyer CREATOR))
    (try! (stx-transfer? fee buyer current-contract))
    (try! (stx-transfer? payout buyer seller))
    (try! (as-contract? ((with-nft current-contract "atelier-29" (list id)))
      (try! (nft-transfer? atelier-29 id tx-sender buyer))))
    (map-delete listings id)
    (print { action: "buy", id: id, price: price, buyer: buyer, seller: seller })
    (ok true)))

(define-public (withdraw-treasury)
  (let ((balance (stx-get-balance current-contract)))
    (asserts! (is-eq tx-sender CREATOR) ERR_OWNER_ONLY)
    (asserts! (> balance u0) ERR_EMPTY_TREASURY)
    (try! (as-contract? ((with-stx balance))
      (try! (stx-transfer? balance tx-sender CREATOR))))
    (ok balance)))
