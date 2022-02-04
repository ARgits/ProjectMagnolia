import { rollItemMacro } from "../ard20";
import { ARd20Actor } from "../documents/actor";
import { ARd20Item } from "../documents/item";
import * as dice from "../dice/dice"

export {};
declare global {
  interface LenientGlobalVariableTypes {
    game: never;
  } 
  interface Game{
    ard20:{
      documents:{
        ARd20Actor:typeof ARd20Actor;
        ARd20Item:typeof ARd20Item
      }
      rollItemMacro:typeof rollItemMacro
      config:CONFIG["ARd20"];
      dice:typeof dice

    }
  }
  interface rollItemMacroType{
    (itemName:string):ARd20Item["roll"]
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
