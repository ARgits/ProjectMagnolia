import { ItemData, ItemDataSource } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData";
import { ARd20Item } from "../../documents/item";

export {};
declare global {
  type FeatRequirementsFormApp = FeatRequirementsFormAppData;
  type FeatRequirementsFormObject = ARd20Item & {
    data: ItemData & {
      data: FeatureDataPropertiesData;
    };
  };
  interface FeatRequirementsFormAppOptions extends FormApplication.Options {
    data: FeatRequirementsFormAppData;
  }
  interface FeatRequirementsFormAppData {
    formApp: {
      values: FeatureReqValue[];
      logic: string[];
    };
    req: FeatureDataPropertiesData["req"]
    type_list: string[];
    feat: {
      awail: FeatureType[];
      current: FeatureReqValue[];
    };
    data: FeatReqData[];
    rank:Omit<CONFIG["ARd20"]["Rank"], 0>
  }
  type FeatureType = FeatureReqValue;
  interface FeatReqData {
    name: string;
    value: string | number;
    type: string;
  }
}
