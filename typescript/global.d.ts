export {};
declare global {
  interface CONFIG {
    ARd20: ARd20CONFIG;
  }
  interface LenientGlobalVariableTypes {
    game: never;
  }
  namespace ClientSettings {
    interface Values {
      "ard20.proficiencies": {
        weapon: WeaponProficienciesSetting[];
        armor: [];
        tools: [];
        skills: [
          {
            name: string;
            untrain: boolean;
            default: string;
          }
        ];
      };
    }
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
interface WeaponProficienciesSetting {
  name: string;
  type: string;
}
type ARd20CONFIG = ARd20CONFIGData;
type ARd20ActorDataSource = CharacterDataSource;
type ARd20ActorDataProperties = CharacterDataProperties;
type ARd20ItemDataSource = ItemDataSource | FeatureDataSource | SpellDataSource | WeaponDataSource | RaceDataSource | ArmorDataSource;
type ARd20ItemDataProperties = ItemDataProperties | FeatureDataProperties | SpellDataProperties | WeaponDataProperties | RaceDataProperties | ArmorDataProperties;
type Attributes = "str" | "dex" | "int" | "wis" | "cha" | "con";
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
type DmgPhysTypes = "acid" | "blud" | "cold" | "fire" | "light" | "necr" | "pierc" | "poison" | "slash";
type DmgTypes = DmgPhysTypes | "force" | "rad" | "psychic";

interface ARd20CONFIGData {
  Attributes: { [Ability in Attributes]: string };
  AbilityAbbreviations: { [Ability in Attributes]: string };
  CHARACTER_EXP_LEVELS: Array<number>;
  SpellSchool: {};
  Skills: { [Skill in Skills]: string };
  Rank: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
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
  DamageSubTypes: { [Dmg in DmgTypes]: string };
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
interface NPCDataProperties {
  type: "npc";
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
    //weapon: Record<number,WeaponProficiencies>[];
    weapon: WeaponProficiencies[];
    armor: Record<number, ArmorProficiencies>;
    tools: Record<number, ToolProficiencies>;
  };
}
interface WeaponProficiencies {
  value: number;
  type: WeaponProficienciesSetting["type"];
  name: string;
  type_hover: string;
  type_value: string;
}
interface ArmorProficiencies {
  value: number;
}
interface ToolProficiencies {
  value: number;
}
interface NPCDataSourceData extends ActorBaseTemplate {
  cr: number;
}
interface CharacterDataPropertiesData extends CharacterDataSourceData {
  attributes: { [Ability in keyof CharacterDataSourceData["attributes"]]: CharacterDataSourceData["attributes"][Ability] & { mod: number; total: number; bonus: number } };
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
    stats: { [stat in keyof CharacterDataSourceData["defences"]["stats"]]: CharacterDataSourceData["defences"]["stats"][stat] & { bonus: number; value: number; label: string; level: number } };
    conditions: {};
  };
  proficiencies: CharacterDataSourceData["proficiencies"];
  speed: { value: number; bonus: number };
  mobility: { value: number; bonus: number };
}
interface NPCDataPropertiesData extends NPCDataSourceData {
  xp: number;
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
