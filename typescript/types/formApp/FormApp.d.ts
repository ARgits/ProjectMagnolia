export {};
declare global {
  interface FeatFormAppData {
    feat: { packs: string[]; folders: string[] };
  }
  type FeatFormAppDataType = FeatFormAppData;
}
