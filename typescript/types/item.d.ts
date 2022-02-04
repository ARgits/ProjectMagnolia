import { ARd20Item } from "../documents/item";

export {};
declare global {
  interface DocumentClassConfig{
    Item:typeof ARd20Item
  }
  interface SourceConfig {
    Item: ARd20ItemDataSource;
  }
  interface DataConfig {
    Item: ARd20ItemDataProperties;
  }
  type ARd20ItemDataSource = ItemDataSource | FeatureDataSource | SpellDataSource | WeaponDataSource | RaceDataSource | ArmorDataSource;
  type ARd20ItemDataProperties = ItemDataProperties | FeatureDataProperties | SpellDataProperties | WeaponDataProperties | RaceDataProperties | ArmorDataProperties;
  interface ItemBaseTemplate {
    description: string;
    hasAttack: boolean;
    hasDamage: boolean;
  }
  interface ItemDataSource {
    type: "item";
    data: ItemDataSourceData;
  }
  interface FeatureDataSource {
    type: "feature";
    data: FeatureDataSourceData;
  }
  interface SpellDataSource {
    type: "spell";
    data: SpellDataSourceData;
  }
  interface WeaponDataSource {
    type: "weapon";
    data: WeaponDataSourceData;
  }
  interface RaceDataSource {
    type: "race";
    data: RaceDataSourceData;
  }
  interface ArmorDataSource {
    type: "armor";
    data: ArmorDataSourceData;
  }
  interface ItemDataProperties extends ItemDataSource{
    data: ItemDataPropertiesData
  }
  interface FeatureDataProperties extends FeatureDataSource{
    data:FeatureDataPropertiesData
  }
  interface SpellDataProperties extends SpellDataSource{
    data:SpellDataPropertiesData
  }
  interface WeaponDataProperties extends WeaponDataSource{
    data:WeaponDataPropertiesData
  }
  interface RaceDataProperties extends RaceDataSource{
    data:RaceDataPropertiesData
  }
  interface ArmorDataProperties extends ArmorDataSource{
    data:ArmorDataPropertiesData
  }
  interface ItemDataSourceData extends ItemBaseTemplate {
    quantity: number;
    weight: number;
    formula: string;
  }
  interface WeaponDataSourceData extends ItemBaseTemplate {
    quantity: number;
    weight: number;
    equipped: boolean;
    type: {
      value: string;
    };
    property: {[Prop in keyof ARd20CONFIGData["WeaponProp"]]:{
      value:number
      bonus:number
    }
    };
    level: {
      value: number;
    };
    damage: {
      common: {
        untrained: {
          parts: Array<string>;
        };
        basic: {
          parts: Array<string>;
        };
        master: {
          parts: Array<string>;
        };
      };
      ver: {
        untrained: {
          parts: Array<string>;
        };
        basic: {
          parts: Array<string>;
        };
        master: {
          parts: Array<string>;
        };
      };
    };
    range: {
      untrained: {
        min: number;
        max: number;
      };
      basic: {
        min: number;
        max: number;
      };
      master: {
        min: number;
        max: number;
      };
    };
    deflect: {
      untrained: string;
      basic: string;
      master: string;
    };
  }
  interface ArmorDataSourceData extends ItemBaseTemplate {
    type: string;
    slot: string;
    equipped: boolean;
    res: {
      phys: object;
      mag: object;
    };
  }
  interface FeatureDataSourceData extends ItemBaseTemplate {
    source: {
      value: Array<string>;
    };
    xp: Array<number>;
    level: {
      initial: number;
      current: number;
    };
    req: {
      values: Array<any>;
      logic: Array<any>;
    };
    damage: {
      parts: Array<any>;
      formula: string;
    };
  }
  interface SpellDataSourceData extends ItemBaseTemplate {
    spellLevel: number;
    school: string;
    sourceOptions: {
      learn: boolean;
      born: boolean;
      contract: boolean;
    };
  }
  interface RaceDataSourceData extends ItemBaseTemplate {
    speed: number;
    bonus: {
      abil: {
        str: {
          value: number;
          sign: boolean;
        };
        dex: {
          value: number;
          sign: boolean;
        };
        con: {
          value: number;
          sign: boolean;
        };
        int: {
          value: number;
          sign: boolean;
        };
        wis: {
          value: number;
          sign: boolean;
        };
        cha: {
          value: number;
          sign: boolean;
        };
      };
      skill: object;
    };
  }
  interface ItemDataPropertiesData extends ItemDataSourceData{}
  interface FeatureDataPropertiesData extends FeatureDataSourceData{}
  interface WeaponDataPropertiesData extends WeaponDataSourceData{
    property:{[Prop in keyof WeaponDataSourceData["property"]]:WeaponDataSourceData["property"][Prop]&{
      label:string
    }}
  }
  interface SpellDataPropertiesData extends SpellDataSourceData{}
  interface RaceDataPropertiesData extends RaceDataSourceData{}
  interface ArmorDataPropertiesData extends ArmorDataSourceData{}
}
