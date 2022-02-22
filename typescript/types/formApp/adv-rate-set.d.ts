export {};
declare global {
  type AdvancementRateFormApp = AdvancementRateFormAppData;
  interface AdvancementRateFormAppData {
    variables: {
      skillCount: number;
      featureCount: number;
      skillLevel: number;
      featureLevel: number;
      attributeLevel: number;
    };
    formulas: {
      skills: string;
      features: string;
      attributes: string;
    };
  }
}
