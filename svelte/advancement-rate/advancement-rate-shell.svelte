<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  const { application } = getContext("external");
  export let form;
  export let advancementSetting;
  export let elementRoot;
  async function updateSettings() {
    application.update(advancementSetting);
    application.close();
  }
  let attributeFormula;
  $: {
    attributeFormula = advancementSetting.formulas.attributes;
    for (let variable of Object.values(advancementSetting.variables)) {
      console.log(attributeFormula);
      attributeFormula = attributeFormula.replace(variable.shortName, variable.value);
    }
  }
  function changeSetting() {
    game.settings.set("ard20", "advancement-rate", advancementSetting);
    console.log("change");
  }
  function requestSubmit() {
    form.requestSubmit;
    game.settings.set("ard20", "advancement-rate", advancementSetting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete="off">
    <section class="grid grid-2col">
      <div>
        <label for="Custom Values"> CustomValues </label>
        <div class="flexrow">
          {#each Object.values(advancementSetting.variables) as variable}
            <label for={variable.longName}>{variable.longName}</label>
            <input bind:value={variable.shortName} on:change={changeSetting} placeholder="shortName" />
            <input type="number" bind:value={variable.value} on:change={changeSetting} placeholder="custom value" />
          {/each}
        </div>
      </div>
      <div>
        <label for="Non-custom Values">Non-custom Values</label>
        <div>AS - Attribute Score</div>
        <div>SS - Skill Score</div>
        <div>SL - Skill level</div>
      </div>
    </section>
    <section>
      <div>
        <label for="Attribute Formula">Attribute Advancement Formula</label>
        <input type="text" on:change={changeSetting} bind:value={advancementSetting.formulas.attributes} />
      </div>
      <div>{attributeFormula}</div>
    </section>
    <footer>
      <button type="button" on:click={requestSubmit}><i class="far fa-save" /></button>
    </footer>
  </form>
</ApplicationShell>
