export class RaceDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      description: new foundry.data.fields.StringField({ nullable: false, required: true, initial: "" }),
      speed: new foundry.data.fields.NumberField({
        nullable: false,
        initial: 6,
        required: true,
        integer: true,
        positive: true,
      }),
      health: new foundry.data.fields.NumberField({
        nullable: false,
        initial: 4,
        required: true,
        integer: true,
        positive: true,
      }),
      attributes: new foundry.data.fields.ObjectField({
        nullable: false,
        required: true,
        initial: {
          strength: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
          dexterity: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
          constitution: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
          intelligence: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
          wisdom: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
          charisma: new foundry.data.fields.NumberField({
            nullable: false,
            initial: 0,
            required: true,
            integer: true,
            positive: false,
          }),
        },
      }),
    };
  }
}
