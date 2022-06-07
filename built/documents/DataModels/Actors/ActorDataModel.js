export class ActorDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      attributes: new MappingField(AttributeDataModel, {initialKeys:{str:'Strength',dex:'Dexterity',log:'Logic',int:'Intuition',cha:'Charisma'}}),
    };
  }
}
class AttributeDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return{
        value: new foundry.data.fields.NumberField({
            required:true, nullable:false, integer:true, min:0, initial: 0
        }),
        bonus: new foundry.data.NumberField({
            required:true, nullable:false, integer:true, initial:0
        })
    };
  }
}
export class MappingField extends ObjectField {

    constructor(model, options) {
      // TODO: Should this also allow the validation of keys?
      super(options);
      if ( !isSubclass(model, DataModel) ) {
        throw new Error("An EmbeddedDataField must specify a DataModel class as its type");
      }
      /**
       * The embedded DataModel definition which is contained in this field.
       * @type {*}
       */
      this.model = model;
    }
  
    /** @inheritdoc */
    clean(value, data, options) {
      value = super.clean(value, data, options);
      for ( let v of Object.values(value) ) {
        if ( this.options.clean instanceof Function ) v = this.options.clean.call(this, v);
        v = this.model.cleanData(v, options);
      }
      return value;
    }
  
    /** @inheritdoc */
    getInitialValue(data) {
      let keys = this.options.initialKeys;
      if ( !keys || !foundry.utils.isObjectEmpty(this.initial) ) return super.getInitialValue(data);
      if ( !(keys instanceof Array) ) keys = Object.keys(keys);
      const initial = {};
      for ( const key of keys ) {
        initial[key] = {};
      }
      return initial;
    }
  
    /** @override */
    validate(value, options={}) {
      const errors = {};
      for ( const [k, v] of Object.entries(value) ) {
        const err = SchemaField.validateSchema(this.model.schema, v, options);
        if ( !isObjectEmpty(err) ) errors[k] = err;
      }
      if ( !isObjectEmpty(errors) ) throw new Error(DataModel.formatValidationErrors(errors));
      return super.validate(value, options);
    }
  
    /** @override */
    initialize(model, name, value) {
      if ( !value ) return value;
      value = foundry.utils.deepClone(value);
      for ( let v of Object.values(value) ) {
        v = new this.model(v, {parent: model});
      }
      return value;
    }
  
  }
  
