<svelte:options accessors={true} />

<script>
  import InputForDocumentSheet from "../general components/InputForDocumentSheet.svelte";
  import ImageWithFilePicker from "../general components/ImageWithFilePicker.svelte";
  import ProgressBar from "../../../general svelte components/ProgressBar.svelte";
  import Tabs from "../general components/Tabs.svelte";
  import AttributeTab from "./AttributeTab.svelte";
  import InventoryTab from "./InventoryTab.svelte";
  import FeaturesTab from "./FeaturesTab.svelte";
  import SpellsTab from "./SpellsTab.svelte";
  import EffectsTab from "./EffectsTab.svelte";
  import BiographyTab from "./BiographyTab.svelte";
  import { getContext } from "svelte";
  const doc = getContext("DocumentSheetObject");
  let tabs = [
    { label: "Attributes", id: "attributes", component: AttributeTab },
    { label: "Inventory", id: "inventory", component: InventoryTab },
    { label: "Features", id: "features", component: FeaturesTab },
    { label: "Spells", id: "spells", component: SpellsTab },
    { label: "Effects", id: "effects", component: EffectsTab },
    { label: "Biography", id: "biography", component: BiographyTab },
  ];
  let activeTab = "attributes";
  console.log($doc);
</script>

<header>
  <div class="cha-img">
    <ImageWithFilePicker path={"img"} alt={"character portrait"} />
  </div>
  <div>
    <div class="name">
      Name: <InputForDocumentSheet bind:value={$doc.name} />
    </div>
    <div class="race">
      Race: {$doc.itemTypes.race[0]?.name || "none"}
    </div>
  </div>
  <div class="level">
    <div>
      Level:{$doc.system.advancement.level}
    </div>
    <div>
      XP used: {$doc.system.advancement.xp.used}
    </div>
    <div>
      XP earned: <InputForDocumentSheet bind:value={$doc.system.advancement.xp.get} type="number" />
    </div>
  </div>
</header>
<div class="content">
  <Tabs {tabs} {activeTab} />
</div>

<style lang="scss">
  header {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid black;
    max-height: 155px;
    & > div {
      flex-direction: column;
      background-image: url("../css/background-scroll.webp");
      background-repeat: no-repeat;
      background-size: 100% 100%;

      display: flex;
      align-items: center;
      justify-content: space-evenly;
      &:not(:first-child) {
        margin-left: 10px;
        padding-left: 10%;
        padding-right: 10%;
        width: 80%;
      }
      & > div {
        mix-blend-mode: difference;
        color: grey;
        text-align: center;
        display: flex;
        & input {
          color: grey;
        }
      }
    }
  }
</style>
