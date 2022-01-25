export {};
declare global {
  interface CONFIG {
    ARd20: ARd20CONFIG;
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
type ARd20CONFIG = ARd20CONFIGData;
type ARd20ActorDataSource = CharacterDataSource | NPCDataSource;
type ARd20ActorDataProperties = CharacterDataProperties;
type ARd20ItemDataSource = ItemDataSource | FeatureDataSource | SpellDataSource | WeaponDataSource | RaceDataSource | ArmorDataSource;
type ARd20ItemDataProperties = ItemDataProperties | FeatureDataProperties | SpellDataProperties | WeaponDataProperties | RaceDataProperties | ArmorDataProperties;
type Abilities = "str" | "dex" | "int" | "wis" | "cha" | "con";
type Skills = "acr" | "ani" | "arc" | "ath" | "dec" | "his" | "ins" | "itm" | "inv" | "med" | "nat" | "prc" | "prf" | "per" | "rel" | "slt" | "ste" | "sur";
type Sources = "mar" | "mag" | "div" | "pri" | "psy";
type WeaponProperties =
  | "aff"
  | "awk"
  | "con"
  | "bra"
  | "def"
  | "dis"
  | "dou"
  | "ent"
  | "fin"
  | "fir"
  | "hea"
  | "lau"
  | "lig"
  | "lun"
  | "mel"
  | "one"
  | "pen"
  | "ran"
  | "rea"
  | "rel"
  | "sta"
  | "thr"
  | "tri"
  | "two"
  | "ver";
type WeaponType = "amb" | "axe" | "blu" | "bow" | "sli" | "cbl" | "cro" | "dbl" | "fir" | "fla" | "whi" | "ham" | "pic" | "pol" | "spe" | "thr";
type DmgTypes = "acid"|"blud"|"cold"|"fire"|"force"|"light"|"necr"|"pierc"|"poison"|"slash"|"sound"|"rad"|"psyhic"
type WithMod<T> = T & {
  mod: number;
  total: number;
};
type Res<T>=T&{
  value:number
  label:string
  bonus:number
  type:string
}

interface ARd20CONFIGData {
  Abilities: { [Ability in Abilities]: string };
  AbilityAbbreviations: { [Ability in Abilities]: string };
  CHARACTER_EXP_LEVELS: Array<number>;
  SpellSchool: {};
  Skills: { [Skill in Skills]: string };
  Rank: {
    0: string;
    1: string;
    2: string;
  };
  Source: { [Source in Sources]: string };
  WeaponProp: { [Prop in WeaponProperties]: string };
  WeaponType: { [Type in WeaponType]: string };
  AbilXP: Array<number>;
  SkillXp: {
    0: Array<number>;
    1: Array<number>;
  };
  DamageTypes: {};
  DamageSubTypes: {[Dmg in DmgTypes]:string};
  ResistTypes: {};
  HPDice: Array<string>;
  HeavyPoints: {};
  RollResult: {};
}
interface CharacterDataSource {
  type: "character";
  data: CharacterDataSourceData;
}
interface CharacterDataProperties {
  type: "character";
  data: CharacterDataPropertiesData;
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
    [Ability in Abilities]: {
      value: number;
      bonus: number;
    };
  };
  skills: { [Skill in Skills]: { rank: number; bonus: number } };
  defences: {
    stats: {
      reflex: {
        bonus: number;
      };
      fortitude: {
        bonus: number;
      };
      will: {
        bonus: number;
      };
    };
    damage: {
      phys: object;
      mag: object;
    };
    conditions: object;
  };
}
interface NPCDataSourceData extends ActorBaseTemplate {
  cr: number;
}
interface CharacterDataPropertiesData extends CharacterDataSourceData {
  abilities: { [Ability in keyof CharacterDataSourceData["abilities"]]: WithMod<CharacterDataSourceData["abilities"][Ability]> };
  defences:{
    damage:{
      phys:{[Resist in DmgTypes]:Res<CharacterDataSourceData["defences"]["damage"]["phys"][Resist]>}
      mag:{[Res in DmgTypes]:{
        value:number
        label:string
        bonus:number
        type:string
      }}
    }
    stats:{[stat in keyof CharacterDataSourceData["defences"]["stats"]]:&CharacterDataSourceData["defences"]["stats"][stat]}
    conditions:{}
  }
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
