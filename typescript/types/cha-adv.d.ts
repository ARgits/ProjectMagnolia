import { ItemData, ItemDataBaseProperties, ItemDataSource } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData";
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
      chosen: string | null;
      list: any[];
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
        mar: 0;
        mag: 0;
        div: 0;
        pri: 0;
        psy: 0;
      };
    };
    content: {
      skills: {};
      feats: {};
    };
    feats: {
      learned: ItemData[];
      awail: ItemDataSource[];
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
  type featureType = ItemDataSource & { data: object & FeatureDataSourceData & { level: FeatureDataPropertiesData["level"] & { xp: {} } } };
}
