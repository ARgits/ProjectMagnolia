export {};
declare global {
  interface FeatureDataPropertiesData extends FeatureDataSourceData {
    req: {
      values: FeatureDataSourceData["req"]["values"];
      logic: FeatureDataSourceData["req"]["logic"];
    };
  }
  interface FeatureReqValue {
    input: number[];
    name: string;
    pass: boolean[];
    subtype_list: string[];
    type: string;
    value: string | number;
  }
}
