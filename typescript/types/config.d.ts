import * as dice from "../dice/dice";
export {};
declare global {
  interface CONFIG {
    ARd20: ARd20CONFIG;
  }
  type ARd20CONFIG = ARd20CONFIGData;
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
    AttributeAbbreviations: { [Ability in Attributes]: string };
    CHARACTER_EXP_LEVELS: Array<number>;
    SpellSchool: {};
    Skills: { [Skill in Skills]: string };
    Rank: {
      [index: number]: string;
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
    HeavyPoints: {
      [index: string]: HeavyPointsSlotType;
      light: HeavyPointsSlotType;
      medium: HeavyPointsSlotType;
      heavy: HeavyPointsSlotType;
    };
    RollResult: {};
  }
  interface HeavyPointsSlotType {
    [index: string]: number;
    chest: number;
    gloves: number;
    boots: number;
    pants: number;
    head: number;
  }
}
