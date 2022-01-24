export class ARd20Actor extends Actor {}
export class ARd20Item extends Item {}
declare global {
  interface DocumentClassConfig {
    Actor: typeof ARd20Actor;
    Item: typeof ARd20Item;
  }
  interface SourceConfig {
    Item: ARd20ItemDataSource;
    Actor: ARd20ActorDataSource;
  }
  interface DataConfig {
    Item: ARd20ItemDataProperties;
    Actor: ARd20ActorDataProperties;
  }
}

type ARd20ActorDataSource = CharacterDataSource | NPCDataSource;
type ARd20ActorDataProperties = CharacterDataProperties;
type ARd20ItemDataSource = ItemDataSource | FeatureDataSource | SpellDataSource | WeaponDataSource | RaceDataSource | ArmorDataSource;
type ARd20ItemDataProperties = ItemDataProperties | FeatureDataProperties | SpellDataProperties | WeaponDataProperties | RaceDataProperties | ArmorDataProperties;
interface CharacterDataSource {
  type: "character";
  data: CharacterDataSourceData;
}
interface NPCDataSource {
  type: "npc";
  data: NPCDataSourceData;
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
  attributes: {
    xp: {
      get: number;
      used: number;
    };
    level: 0;
  };
  speed: {
    bonus: number;
  };
  abilities: {
    str: {
      value: number;
      bonus: number;
    };
    dex: {
      value: number;
      bonus: number;
    };
    con: {
      value: number;
      bonus: number;
    };
    int: {
      value: number;
      bonus: number;
    };
    wis: {
      value: number;
      bonus: number;
    };
    cha: {
      value: number;
      bonus: number;
    };
  };
  skills: {
    acr: {
      rank: number;
      bonus: number;
    };
    ath: {
      rank: number;
      bonus: number;
    };
    ani: {
      rank: number;
      bonus: number;
    };
    arc: {
      rank: number;
      bonus: number;
    };
    dec: {
      rank: number;
      bonus: number;
    };
    his: {
      rank: number;
      bonus: number;
    };
    ins: {
      rank: number;
      bonus: number;
    };
    itm: {
      rank: number;
      bonus: number;
    };
    inv: {
      rank: number;
      bonus: number;
    };
    med: {
      rank: number;
      bonus: number;
    };
    nat: {
      rank: number;
      bonus: number;
    };
    prc: {
      rank: number;
      bonus: number;
    };
    prf: {
      rank: number;
      bonus: number;
    };
    per: {
      rank: number;
      bonus: number;
    };
    rel: {
      rank: number;
      bonus: number;
    };
    slt: {
      rank: number;
      bonus: number;
    };
    ste: {
      rank: number;
      bonus: number;
    };
    sur: {
      rank: number;
      bonus: number;
    };
    defences: {
      stats: {
        reflex: {
          bonus: number;
        };
        fortitude: {
          bonus: number;
        };
        will: {
          bonus: 0;
        };
      };
      damage: {
        phys: object;
        mag: object;
      };
      conditions: object;
    };
  };
}
interface NPCDataSourceData extends ActorBaseTemplate {
  cr: number;
}
interface CharacterDataProperties extends CharacterDataSourceData {
  abilities: {
    str: CharacterDataSourceData["abilities"]["str"] & {
      mod: number;
    };
    dex: CharacterDataSourceData["abilities"]["dex"] & {
      mod: number;
    };
    con: CharacterDataSourceData["abilities"]["con"] & {
      mod: number;
    };
    int: CharacterDataSourceData["abilities"]["int"] & {
      mod: number;
    };
    wis: CharacterDataSourceData["abilities"]["wis"] & {
      mod: number;
    };
    cha: CharacterDataSourceData["abilities"]["cha"] & {
      mod: number;
    };
  };
  
}
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
