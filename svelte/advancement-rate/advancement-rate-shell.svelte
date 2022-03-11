<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let form;
  let advancementSetting = game.settings.get("ard20", "advancement-rate");
  export let elementRoot;
  let attributeFormula;
  $: {
    attributeFormula = advancementSetting.formulas.attributes;
    for (let variable of Object.values(advancementSetting.variables)) {
      if (variable.value) {
        console.log(attributeFormula);
        attributeFormula = attributeFormula.replaceAll(variable.shortName, variable.value);
      }
    }
  }
  function changeSetting() {
    game.settings.set("ard20", "advancement-rate", advancementSetting);
    console.log("change");
  }
</script>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} autocomplete="off">
    <section class="grid grid-2col">
      <div>
        <label for="Custom Values"> CustomValues </label>
        <div class="flexrow">
          {#each Object.values(advancementSetting.variables) as variable}
            <label for={variable.longName}>{variable.longName}</label>
            <input class="max-dig-5" bind:value={variable.shortName} on:change={changeSetting} placeholder="shortName" />
            <input class="max-dig-3" type="number" bind:value={variable.value} on:change={changeSetting} placeholder="custom value" />
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
      <br />
      <div>{attributeFormula}</div>
      <br />
    </section>
  </form>
</ApplicationShell>
