export {};
declare global {
  interface FeatFormAppData {
    feat: { packs: { name: string; id: number }[]; folders: { name: string; id: number }[] };
  }
  type FeatFormAppDataType = FeatFormAppData;
}
