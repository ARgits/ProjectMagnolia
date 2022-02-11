import { ItemData, ItemDataBaseProperties, ItemDataProperties, ItemDataSource } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData";
import { PropertiesToSource } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { ARd20Actor } from "../documents/actor";
import { ARd20Item } from "../documents/item";

export {};
declare global {
  type CharacterAdvancementFormApp = CharacterAdvancementFormAppData;
  type CharacterAdvancementFormObject = ARd20Actor;
  interface CharacterAdvancementFormAppOptions extends FormApplication.Options {
    data: CharacterAdvancementFormAppData;
  }
  interface CharacterAdvancementFormAppData {
    isReady: boolean;
    attributes: {
      [Attribute in keyof CharacterDataPropertiesData["attributes"]]: CharacterDataPropertiesData["attributes"][Attribute] & {
        xp?: number;
        isEq?: boolean;
        isXP?: boolean;
        final?: number;
      };
    };
    skills: {
      [Skill in keyof CharacterDataPropertiesData["skills"]]: CharacterDataPropertiesData["skills"][Skill] & {
        xp?: number | boolean;
        isEq?: boolean;
        isXP?: boolean;
        final?: number;
      };
    };
    xp: CharacterDataPropertiesData["advancement"]["xp"];
    profs: CharacterDataPropertiesData["proficiencies"];
    health: CharacterDataPropertiesData["health"];
    races: {
      chosen: string;
      list: RaceItem[];
    };
    count: {
      skills: {
        [index: number]: number;
        0: number;
        1: number;
        2: number;
        3: number;
        4: number;
      };
      feats: {
        [index: string]: number;
        mar: number;
        mag: number;
        div: number;
        pri: number;
        psy: number;
      };
    };
    content: {
      skills: {};
      feats: {};
    };
    feats: {
      learned: FeatureItem[];
      awail: FeatureItem[];
    };
    allow: {
      attribute: boolean;
      race: boolean;
      final: boolean;
    };
    hover: {
      attribute: string;
      skill: string;
      race: string;
      feat: string;
    };
  }
  type RaceItem = (ItemDataSource|ItemData) & RaceItemData;
  type FeatureItem = (ItemDataSource|ItemData) & FeatureItemData;
  interface RaceItemData extends RaceDataProperties {
    chosen: boolean;
  }
  interface FeatureItemData extends FeatureDataProperties {
    currentXP: number;
    isEq: boolean;
    isXP: boolean;
    pass:boolean[]
    data:FeatureDataProperties["data"]&{

    }
  }

  type ItemOfType<Type extends foundry.data.ItemData["type"]> = ARd20Item & { data: { type: Type; _source: { type: Type } } };
}
