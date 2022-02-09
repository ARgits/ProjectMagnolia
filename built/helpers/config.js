export const ARd20 = CONFIG.ARd20;
ARd20.Attributes = {
    str: "ARd20.AttributeStr",
    dex: "ARd20.AttributeDex",
    con: "ARd20.AttributeCon",
    int: "ARd20.AttributeInt",
    wis: "ARd20.AttributeWis",
    cha: "ARd20.AttributeCha",
};
ARd20.AttributeAbbreviations = {
    str: "ARd20.AttributeStrAbbr",
    dex: "ARd20.AttributeDexAbbr",
    con: "ARd20.AttributeConAbbr",
    int: "ARd20.AttributeIntAbbr",
    wis: "ARd20.AttributeWisAbbr",
    cha: "ARd20.AttributeChaAbbr",
};
ARd20.CHARACTER_EXP_LEVELS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
ARd20.SpellSchool = {
    abj: "ARd20.SchoolAbj",
    con: "ARd20.SchoolCon",
    div: "ARd20.SchoolDiv",
    enc: "ARd20.SchoolEnc",
    evo: "ARd20.SchoolEvo",
    ill: "ARd20.SchoolIll",
    nec: "ARd20.SchoolNec",
    trs: "ARd20.SchoolTrs",
};
ARd20.Skills = {
    acr: "ARd20.SkillAcr",
    ani: "ARd20.SkillAni",
    arc: "ARd20.SkillArc",
    ath: "ARd20.SkillAth",
    dec: "ARd20.SkillDec",
    his: "ARd20.SkillHis",
    ins: "ARd20.SkillIns",
    itm: "ARd20.SkillItm",
    inv: "ARd20.SkillInv",
    med: "ARd20.SkillMed",
    nat: "ARd20.SkillNat",
    prc: "ARd20.SkillPrc",
    prf: "ARd20.SkillPrf",
    per: "ARd20.SkillPer",
    rel: "ARd20.SkillRel",
    slt: "ARd20.SkillSlt",
    ste: "ARd20.SkillSte",
    sur: "ARd20.SkillSur",
};
ARd20.Rank = {
    0: "ARd20.Untrained",
    1: "ARd20.Basic",
    2: "ARd20.Expert",
    3: "ARd20.Master",
    4: "ARd20.Legend",
};
ARd20.Source = {
    mar: "ARd20.Martial",
    mag: "ARd20.Magical",
    div: "ARd20.Divine",
    pri: "ARd20.Primal",
    psy: "ARd20.Psyhic",
};
ARd20.WeaponProp = {
    aff: "ARd20.Affixed",
    awk: "ARd20.Awkward",
    con: "ARd20.Conceal",
    bra: "ARd20.Brace",
    def: "ARd20.Deflect",
    dis: "ARd20.Disarm",
    dou: "ARd20.Double Ended",
    ent: "ARd20.Entangle",
    fin: "ARd20.Finesse",
    fir: "ARd20.Firearm",
    hea: "ARd20.Heavy",
    lau: "ARd20.Launch",
    lig: "ARd20.Light",
    lun: "ARd20.Lunge",
    mel: "ARd20.Melee",
    one: "ARd20.One-Handed",
    pen: "ARd20.Penetrate",
    ran: "ARd20.Ranged",
    rea: "ARd20.Reach",
    rel: "ARd20.Reload",
    sta: "Ard20.Stagger",
    thr: "ARd20.Thrown",
    tri: "ARd20.Trip",
    two: "ARd20.Two-Handed",
    ver: "ARd20.Versatile",
};
ARd20.WeaponType = {
    amb: "ARd20.Ambush",
    axe: "ARd20.Axe",
    blu: "ARd20.Bludgeon",
    bow: "ARd20.Bow",
    sli: "ARd20.Sling",
    cbl: "ARd20.Combat Blade",
    cro: "ARd20.Crossbow",
    dbl: "ARd20.Dueling Blade",
    fir: "ARd20.Firearm",
    fla: "ARd20.Flail",
    whi: "ARd20.Whip",
    ham: "ARd20.Hammer",
    pic: "ARd20.Pick",
    pol: "ARd20.Polearm",
    spe: "ARd20.Spear",
    thr: "ARd20.Throwing",
};
ARd20.AbilXP = [50, 50, 50, 50, 70, 90, 120, 150, 190, 290, 440, 660, 990, 1500, 2700, 4800, 8400, 14700, 25700, 51500, 103000, 206000, 412000, 824000, 2060000];
ARd20.SkillXP = {
    0: [50, 80, 125, 185, 260, 350, 455, 575, 710, 860, 1025, 1205, 1400, 1610, 1835, 2075, 2330, 2600],
    1: [115, 190, 295, 430, 595, 790, 1015, 1270, 1555, 1870, 2215, 2590, 2995, 3430, 3895, 4390, 4915, 5470],
};
ARd20.DamageTypes = {
    mag: "ARd20.Magical",
    phys: "ARd20.Physical",
};
ARd20.DamageSubTypes = {
    acid: "ARd20.DamageAcid",
    blud: "ARd20.DamageBludgeoning",
    cold: "ARd20.DamageCold",
    fire: "ARd20.DamageFire",
    force: "ARd20.DamageForce",
    light: "ARd20.DamageLightning",
    necr: "ARd20.DamageNecrotic",
    pierc: "ARd20.DamagePiercing",
    poison: "ARd20.DamagePoison",
    slash: "ARd20.DamageSlashing",
    rad: "ARd20.DamageRadiant",
    psychic: "ARd20.DamagePsychic",
};
ARd20.ResistTypes = {
    res: "ARd20.Resistance",
    vul: "Ard20.Vulnerability",
    imm: "ARd20.Immunity",
};
ARd20.HPDice = ["1d6", "1d8", "1d10", "1d12", "1d12+2", "1d12+4", "1d20", "1d20+2", "1d20+4", "1d20+6", "1d20+8", "1d20+10", "1d20+12"];
ARd20.HeavyPoints = {
    light: { chest: 3, gloves: 1, boots: 1, pants: 2, head: 1 },
    medium: { chest: 5, gloves: 2, boots: 2, pants: 3, head: 2 },
    heavy: { chest: 8, gloves: 3, boots: 3, pants: 5, head: 3 },
};
ARd20.RollResult = {
    0: "ARd20.Fumble",
    1: "ARd20.Fail",
    2: "ARd20.Success",
    3: "ARd20.Crit",
};
