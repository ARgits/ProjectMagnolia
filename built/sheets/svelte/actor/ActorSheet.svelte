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
  <div class="main-info">
    <div>
      <div class="nameAndRace">
        <div class="name">
          <InputForDocumentSheet bind:value={$doc.name} label="name" />
        </div>
        <div class="race">
          Race: {$doc.itemTypes.race[0]?.name || "none"}
        </div>
      </div>
      <div class="health">
        <InputForDocumentSheet bind:value={$doc.system.health.value} label="health"/>
        <span>{$doc.system.health.max}</span>
      </div>
      <div class="level">
        <div>
          <InputForDocumentSheet bind:value={$doc.system.advancement.xp.get} type="number" label="XP earned" />
        </div>
        <div>
          XP used: {$doc.system.advancement.xp.used}
        </div>
      </div>
    </div>
    <div class="attributes">
      {#each Object.entries($doc.system.attributes) as attribute}
        <div data-tooltip='roll ${attribute[1].label}' data-tooltip-direction='DOWN'
          on:click={(event) => {
            event.preventDefault;
            return $doc.rollAttributeTest(attribute[0], { event: event });
          }}
        >
          <span>
            {attribute[1].label}
          </span>
          <span> Value: {attribute[1].value}</span>
          <span> Mod: {attribute[1].mod}</span>
        </div>
      {/each}
    </div>
    <div class="resources">
      {#each Object.entries($doc.system.resources) as resource}
        <span>{resource[0]}</span>: <span>{resource[1].value} / {resource[1].max}</span>
      {/each}
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

    & .main-info {
      display: flex;
      flex-direction: column;

      & > :not(.attributes){
        display: flex;
        flex-direction: row;
        justify-content: space-around;
      }
      & > .attributes {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 10px;
        & > div {
          display: flex;
          flex-direction: column;
          border: 1px solid black;
          flex: 1 0 calc(100% / 6 - 1.2em);
          align-items: center;
          margin: 0.6em;
          border-radius: 10px;
          &:hover {
            text-shadow: red 0px 0px 0.5em;
            cursor: pointer;
          }
        }
      }
    }
  }
  .cha-img{
    max-width: 150px;
  }
</style>
