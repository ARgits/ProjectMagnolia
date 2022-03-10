export {};
declare global {
  type AdvancementRateFormApp = AdvancementRateFormAppData;
  interface AdvancementRateFormAppData {
    variables: {
      skillCount: {
        value:number,
        shortName:string,
        longName:string
    };
      featureCount: {
        value:number,
        shortName:string,
        longName:string
    };
      skillValue: {
        value:number,
        shortName:string,
        longName:string
    };
      featureLevel: {
        value:number,
        shortName:string,
        longName:string
    };
      attributeValue: {
        value:number,
        shortName:string,
        longName:string
    };
    };
    formulas: {
      skills: string;
      features: string;
      attributes: string;
    };
  }
}
