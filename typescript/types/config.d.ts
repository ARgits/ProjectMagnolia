export {};
declare global {
  interface CONFIG {
    ARd20: ARd20CONFIG;
  }
  type ARd20CONFIG = ARd20CONFIGData;
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
}
