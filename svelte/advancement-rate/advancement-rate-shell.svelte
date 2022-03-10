<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
import { each } from "svelte/internal";
import { arr_entries } from "../../typescript/ard20";
  const { application } = getContext("external");
  export let form;
  export let advancementSetting;
  export let elementRoot;
  async function updateSettings() {
    application.update(advancementSetting);
    application.close();
  }
  function changeSetting() {
    game.settings.set("ard20", "advancement-rate", advancementSetting);
    const variables = game.settings.get("ard20","advancement-rate").variables
    const formulas = game.settings.get("ard20","advancement-rate").formulas
    attributeFormula = formulas.attributes
    for (let variable of Object.values(variables)){
      attributeFormula = attributeFormula.replace(variable.shortName,variable.value)
    }
  }
  function requestSubmit() {
    form.requestSubmit;
    game.settings.set("ard20", "advancement-rate", advancementSetting);
  }
  let attributeFormula
  console.log(application);
  console.log(advancementSetting);
  console.log(form);
</script>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete="off">
    <section class="grid grid-2col">
      <div class="flexrow">
        <label>CustomValues</label>
        {#each Object.values(advancementSetting.variables) as variable}
          <label>{variable.longName}</label>
          <input bind:value={variable.shortName} on:change={changeSetting} placeholder="shortName">
          <input bind:value={variable.value} on:change={changeSetting} placeholder="custom value">
        {/each}
      <div>
        <label>Non-custom Values</label>
        <div>As - Attribute Score</div>
        <div>SS - Skill Score</div>
        <div>SL - Skill level</div>
      </div>
    </section>
    <section>
      <div>
        <label>Attribute Advancement Formula</label>
        <input on:change={changeSetting} bind:value={advancementSetting.formulas.attributes} />
      </div>
      <div>{attributeFormula}</div>
    </section>
    <footer>
      <button type="button" on:click={requestSubmit}><i class="far fa-save" /></button>
    </footer>
  </form>
</ApplicationShell>
