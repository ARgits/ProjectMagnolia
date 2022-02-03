export {};
declare global {
  interface LenientGlobalVariableTypes {
    game: never;
  } 
  namespace ClientSettings {
    interface PartialMenuSetting{
      scope:"world"|"client"
    }
    interface Values {
      "ard20.proficiencies": {
        weapon: Array<WeaponProficienciesSetting>;
        armor: Array<ArmorProficienciesSetting>;
        tools: Array<ToolProficienciesSetting>;
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

  
  interface WeaponProficienciesSetting {
    name: string;
    type: string;
  }
  interface ArmorProficienciesSetting {
    name: string;
    type: string;
  }
  interface ToolProficienciesSetting {
    name: string;
  }
}
