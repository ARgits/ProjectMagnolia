import { ARd20Item } from "../documents/item";

export {};
declare global {
  interface DocumentClassConfig {
    Item: typeof ARd20Item;
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
  interface ItemDataProperties {
    type: "item";
    data: ItemDataPropertiesData;
  }
  interface FeatureDataProperties {
    type: "feature";
    data: FeatureDataPropertiesData;
  }
  interface SpellDataProperties {
    type: "spell";
    data: SpellDataPropertiesData;
  }
  interface WeaponDataProperties {
    type: "weapon";
    data: WeaponDataPropertiesData;
  }
  interface RaceDataProperties {
    type: "race";
    data: RaceDataPropertiesData;
  }
  interface ArmorDataProperties {
    type: "armor";
    data: ArmorDataPropertiesData;
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
    property: {
      [Prop in keyof ARd20CONFIGData["WeaponProp"]]: {
        value: number;
        bonus: number;
      };
    };
    proficiency: {
      level: 0 | 1 | 2 | 3 | 4;
    };
    damage: {
      common: {};
      ver: {};
    };
    range: {};
    deflect: {};
  }
  interface ArmorDataSourceData extends ItemBaseTemplate {
    type: string;
    slot: string;
    equipped: boolean;
    res: {
      phys: {
        [DMG in DmgPhysTypes]: {
          bonus: number;
          type: string;
        };
      };
      mag: {
        [DMG in DmgTypes]: {
          bonus: number;
          type: string;
        };
      };
    };
    mobility: {
      bonus: number;
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
      attributes: {
        [Attr in Attributes]: {
          value: number;
        };
      };
      skills: {
        [Skill in Skills]:{
          value:number
        }
      };
    };
  }
  interface ItemDataPropertiesData extends ItemDataSourceData {}
  interface FeatureDataPropertiesData extends FeatureDataSourceData {}
  interface WeaponDataPropertiesData extends WeaponDataSourceData {
    property: {
      [Prop in keyof WeaponDataSourceData["property"]]: WeaponDataSourceData["property"][Prop] & {
        label: string;
      };
    };
    sub_type: string;
    sub_type_array: WeaponProficienciesSetting[];
    proficiency: WeaponDataSourceData["proficiency"] & {
      name: string;
    };
    type: WeaponDataSourceData["type"] & {
      name: string;
    };
  }
  interface SpellDataPropertiesData extends SpellDataSourceData {}
  interface RaceDataPropertiesData extends RaceDataSourceData {}
  interface ArmorDataPropertiesData extends ArmorDataSourceData {
    res: {
      phys: {
        [DMG in keyof ArmorDataSourceData["res"]["phys"]]: ArmorDataSourceData["res"]["phys"][DMG] & {
          value: number;
        };
      };
      mag: {
        [DMG in keyof ArmorDataSourceData["res"]["mag"]]: ArmorDataSourceData["res"]["mag"][DMG] & {
          value: number;
        };
      };
    };
    mobility: ArmorDataSourceData["mobility"] & {
      value: number;
    };
  }
}
