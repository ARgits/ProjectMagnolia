export {};
declare global {
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
      untrained: object;
      basic: object;
      master: object;
    };
    prof: {
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
  interface ItemDataProperties extends ItemDataSourceData{}
  interface FeatureDataProperties extends FeatureDataSourceData{}
  interface WeaponDataProperties extends WeaponDataSourceData{}
  interface SpellDataProperties extends SpellDataSourceData{}
  interface RaceDataProperties extends RaceDataSourceData{}
  interface ArmorDataProperties extends ArmorDataSourceData{}
}
