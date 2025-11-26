export const PACKAGE_ID = '0x48dd2fb3d454993f86665027fcfe971c463c6e614d76c3e19acc1f80d67704a1';
export const ADMIN_CAP_ID = '0x0c3a95bb920b5e2046409307f06c6d02e80f6266337cb7117058bc63e52137e9';
export const OCT_TYPE = '0x2::oct::OCT';
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
  { label: '30 Minutes', value: 1800000 },
  { label: '1 Hour', value: 3600000 },
];
