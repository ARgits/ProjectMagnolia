export {};
declare global {
 
  interface LenientGlobalVariableTypes {
    game: never;
  }
  namespace ClientSettings {
    interface Values {
      "ard20.proficiencies": {
        weapon: Array<WeaponProficienciesSetting>;
        armor: [];
        tools: [];
        skills: {
          name: string;
          untrain: boolean;
          default: string;
        }[];
      };
      "ard20.feat": {
        packs: string[];
        folders: string[];
      };
    }
  }
}
interface FeatFormAppData {
  sheetData: { feat: { packs: string[]; folders: string[] } };
}
interface WeaponProficienciesSetting {
  name: string;
  type: string;
}
type FeatFormAppDataType = FeatFormAppData





