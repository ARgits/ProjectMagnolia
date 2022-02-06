import { ConfiguredDocumentClass } from "@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes";
import { ARd20Actor } from "../documents/actor";
import { ARd20ActorSheet } from "../sheets/actor-sheet";

export {};
declare global {
  interface Data<Options extends ActorSheet.Options = ActorSheet.Options>
  extends DocumentSheet.Data<InstanceType<ConfiguredDocumentClass<typeof Actor>>, Options> {
  
  }
  interface DocumentClassConfig {
    Actor: typeof ARd20Actor;
  }
  interface SourceConfig {
    Actor: ARd20ActorDataSource;
  }
  interface DataConfig {
    Actor: ARd20ActorDataProperties;
  }
  type ARd20ActorDataSource = CharacterDataSource | NPCDataSource;
  type ARd20ActorDataProperties = CharacterDataProperties | NPCDataProperties;
  type Attributes = "str" | "dex" | "int" | "wis" | "cha" | "con";
  type Skills = "acr" | "ani" | "arc" | "ath" | "dec" | "his" | "ins" | "itm" | "inv" | "med" | "nat" | "prc" | "prf" | "per" | "rel" | "slt" | "ste" | "sur";
  
  interface CharacterDataSource {
    type: "character";
    data: CharacterDataSourceData;
  }
  interface CharacterDataProperties {
    type:"character"
    data: CharacterDataPropertiesData;
  }
  interface NPCDataSource {
    type: "npc";
    data: NPCDataSourceData;
  }
  interface NPCDataProperties{
    type:"npc"
    data: NPCDataPropertiesData;
  }
  interface ActorBaseTemplate {
    health: {
      value: number;
      max: number;
    };
    biography: string;
  }
  interface CharacterDataSourceData extends ActorBaseTemplate {
    isReady: boolean;
    advancement: {
      xp: {
        get: number;
        used: number;
      };
      level: number;
    };
    mobility: {};
    speed: {};
    attributes: {
      [Attribute in Attributes]: {
        value: number;
      };
    };
    skills: { [Skill in Skills]: { value: number } };
    defences: {
      stats: {
        reflex: {};
        fortitude: {};
        will: {};
      };
      damage: {
        phys: {};
        mag: {};
      };
      conditions: object;
    };
    proficiencies: {
    };
  }
  interface WeaponProficiencies extends WeaponProficienciesSetting {
    value: number;
  }
  interface NPCDataSourceData extends ActorBaseTemplate {
    cr: number;
  }
  interface CharacterDataPropertiesData extends CharacterDataSourceData {
    attributes: {
      [Ability in keyof CharacterDataSourceData["attributes"]]: CharacterDataSourceData["attributes"][Ability] & {
        mod: number;
        total: number;
        bonus: number;
      };
    };
    advancement: { xp: CharacterDataSourceData["advancement"]["xp"] & { level: number; level_min: number; bar_max: number; bar_min: number }; level: number };
    skills: { [Skill in keyof CharacterDataSourceData["skills"]]: CharacterDataSourceData["skills"][Skill] & { bonus: number; level: number; name: string; rankName: string } };
    defences: {
      damage: {
        phys: {
          [dmg in DmgPhysTypes]: {
            value: number;
            label: string;
            bonus: number;
            type: string;
          };
        };
        mag: {
          [Res in DmgTypes]: {
            value: number;
            label: string;
            bonus: number;
            type: string;
          };
        };
      };
      stats: {
        [stat in keyof CharacterDataSourceData["defences"]["stats"]]: CharacterDataSourceData["defences"]["stats"][stat] & {
          bonus: number;
          value: number;
          label: string;
          level: number;
        };
      };
      conditions: {};
    };
    proficiencies: {
      weapon:Array<WeaponProficiencies>
      armor:Array<WeaponProficiencies>
      tools:Array<WeaponProficiencies>
    };
    speed: { value: number; bonus: number };
    mobility: { value: number; bonus: number };
  }
  interface NPCDataPropertiesData extends NPCDataSourceData {
    xp: number;
  }
}
