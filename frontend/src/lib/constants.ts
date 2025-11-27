// OLD Duel Contract (for reference)
// export const OLD_PACKAGE_ID = '0x48dd2fb3d454993f86665027fcfe971c463c6e614d76c3e19acc1f80d67704a1';
// export const OLD_ADMIN_CAP_ID = '0x0c3a95bb920b5e2046409307f06c6d02e80f6266337cb7117058bc63e52137e9';

// NEW Package (contains BOTH duel + mock_dex)
export const PACKAGE_ID = '0x803fc510b1b66e91e5156d830b0e9673298db26c2cb6aff044b93c96002f8fcf';
export const DEX_PACKAGE_ID = '0x803fc510b1b66e91e5156d830b0e9673298db26c2cb6aff044b93c96002f8fcf'; // Same!

// Storage Objects
export const ADMIN_CAP_ID = '0x196fe14c0a293bfae5732c3f743f755b5fb73b19b164c287ce3b9bbbf0e2d189';
export const DEX_STORAGE_ID = '0x055a7acfc4045b8411a48d64a62724d058dd16a5f43e2666aba468a218c56ef3';

// Token Types
export const OCT_TYPE = '0x2::oct::OCT';
export const MOCK_USD_TYPE = `${PACKAGE_ID}::mock_dex::MOCK_DEX`; // CRITICAL: It's MOCK_DEX, not MOCK_USD!

export const RPC_URL = 'https://rpc-testnet.onelabs.cc:443';
export const CLOCK_OBJECT = '0x6';

export const DUEL_STATUS = {
  OPEN: 0,
  ACTIVE: 1,
  RESOLVED: 2,
  CANCELLED: 3,
} as const;

export const PLATFORM_FEE = 0.025; // 2.5%

export const DURATION_OPTIONS = [
  { label: '3 Minutes', value: 180000 },
  { label: '5 Minutes', value: 300000 },
  { label: '10 Minutes', value: 600000 },
];
