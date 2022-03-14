export {};
declare global {
  interface FeatFormAppData {
    packs: {name:string,id:string}[];
    folders: {name:string,id:string}[];
  }

  type FeatFormAppDataType = FeatFormAppData;
}
