<svelte:options accessors={true} />

<script>
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  const setting = "advancement-rate";
  let data = game.settings.get("ard20", setting);
  export let elementRoot;
  let attributeFormula;
  $: {
    attributeFormula = data.formulas.attributes;
    for (let variable of Object.values(data.variables)) {
      if (variable.value) {
        console.log(attributeFormula);
        attributeFormula = attributeFormula.replaceAll(variable.shortName, variable.value);
      }
    }
  }
</script>

<ApplicationShell bind:elementRoot>
  <div class="">
    <div>
      <label for="Custom Values"> CustomValues </label>
      <div class="grid grid-2col">
        {#each Object.values(data.variables) as variable}
          <label for={variable.longName}>{variable.longName}</label>
          <input bind:value={variable.shortName} placeholder="shortName" />
        {/each}
      </div>
    </div>
    <div>
      <label for="Attribute Formula">Attribute Advancement Formula</label>
      <input type="text" bind:value={data.formulas.attributes} />
    </div>
    <br />
    <div>
      <label for="Skill Formula">Skill Advancement Formula</label>
      <input type="text" bind:value={data.formulas.skills} />
    </div>
    <br />
    <div>
      <label for="Feature Formula">Feature Advancement Formula</label>
      <input type="text" bind:value={data.formulas.features} />
    </div>
  <SettingsSubmitButton {setting} {data} />
  </div>
</ApplicationShell>

