export {};
declare global {
  type AdvancementRateFormApp = AdvancementRateFormAppData;
  interface AdvancementRateFormAppData {
    variables: {
      skillCount: number;
      featureCount: number;
      skillValue: number;
      featureLevel: number;
      attributeValue: number;
    };
    formulas: {
      skills: string;
      features: string;
      attributes: string;
    };
  }
}
